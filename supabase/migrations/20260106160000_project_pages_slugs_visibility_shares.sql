-- Public project pages foundation:
-- - projects.slug (unique URL identifier)
-- - projects.owner_id (creator)
-- - projects.visibility (public/unlisted/private)
-- - project_shares (viewer/editor per-user access)
-- - RLS policies to enforce view/edit/share rules

-- 1) Columns on projects
alter table public.projects
  add column if not exists slug text,
  add column if not exists owner_id uuid,
  add column if not exists visibility text;

-- Set default visibility for existing rows
update public.projects
set visibility = 'public'
where visibility is null;

alter table public.projects
  alter column visibility set default 'public';

-- Constrain visibility values
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_visibility_check'
  ) then
    alter table public.projects
      add constraint projects_visibility_check
      check (visibility in ('public', 'unlisted', 'private'));
  end if;
end $$;

-- owner_id FK -> auth.users
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_owner_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_owner_id_fkey
      foreign key (owner_id) references auth.users (id)
      on delete set null;
  end if;
end $$;

-- 2) Slug helpers
create or replace function public.slugify_project_name(project_name text)
returns text
language sql
immutable
set search_path to ''
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(project_name, 'project')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.generate_project_slug(project_name text, project_id uuid)
returns text
language plpgsql
immutable
set search_path to ''
as $$
declare
  base text;
  candidate text;
begin
  base := public.slugify_project_name(project_name);

  if base is null or length(base) = 0 then
    base := 'project';
  end if;

  candidate := base;

  -- If collision, append a short id suffix
  if exists (
    select 1
    from public.projects p
    where p.slug = candidate
      and p.id is distinct from project_id
  ) then
    candidate := base || '-' || substr(project_id::text, 1, 8);
  end if;

  return candidate;
end;
$$;

-- 3) Backfill slugs
update public.projects p
set slug = public.generate_project_slug(p.name, p.id)
where p.slug is null or length(trim(p.slug)) = 0;

-- 4) Deduplicate slugs (e.g. multiple "test" projects)
with ranked as (
  select
    id,
    slug,
    row_number() over (partition by slug order by created_at nulls last, id) as rn
  from public.projects
  where slug is not null
    and length(trim(slug)) > 0
)
update public.projects p
set slug = p.slug || '-' || substr(p.id::text, 1, 8)
from ranked r
where p.id = r.id
  and r.rn > 1;

-- 5) Enforce slug uniqueness
create unique index if not exists projects_slug_unique_idx
  on public.projects (slug);

-- Optional basic constraint: slug not blank when set
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_slug_not_blank'
  ) then
    alter table public.projects
      add constraint projects_slug_not_blank
      check (slug is null or length(trim(slug)) > 0);
  end if;
end $$;

-- 6) Auto-set slug on insert/update (if missing)
create or replace function public.ensure_project_slug()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.slug is null or length(trim(new.slug)) = 0 then
    new.slug := public.generate_project_slug(new.name, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_project_slug on public.projects;

create trigger trg_ensure_project_slug
before insert or update of name, slug
on public.projects
for each row
execute function public.ensure_project_slug();

-- 7) Sharing table
create table if not exists public.project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint project_shares_role_check check (role in ('viewer', 'editor')),
  constraint project_shares_project_user_unique unique (project_id, user_id)
);

create index if not exists project_shares_project_id_idx
  on public.project_shares (project_id);

create index if not exists project_shares_user_id_idx
  on public.project_shares (user_id);

-- 8) RLS + helper access functions
alter table public.projects enable row level security;
alter table public.project_shares enable row level security;

create or replace function public.user_can_view_project(pid uuid)
returns boolean
language sql
stable
set search_path to ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = pid
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_shares s
      where s.project_id = pid
        and s.user_id = auth.uid()
    );
$$;

create or replace function public.user_can_edit_project(pid uuid)
returns boolean
language sql
stable
set search_path to ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = pid
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_shares s
      where s.project_id = pid
        and s.user_id = auth.uid()
        and s.role = 'editor'
    );
$$;

-- Projects: view allowed if public/unlisted OR explicitly allowed
drop policy if exists projects_select_public_or_shared on public.projects;
create policy projects_select_public_or_shared
on public.projects
for select
using (
  visibility in ('public', 'unlisted')
  or public.user_can_view_project(id)
);

-- Projects: edit allowed if owner/admin/editor-share
drop policy if exists projects_update_owner_admin_editor on public.projects;
create policy projects_update_owner_admin_editor
on public.projects
for update
using (public.user_can_edit_project(id))
with check (public.user_can_edit_project(id));

-- NOTE: We do not change INSERT policy here to avoid breaking the current submit flow.

-- Shares: participants can see shares; only owner/admin can modify shares
drop policy if exists project_shares_select_participants on public.project_shares;
create policy project_shares_select_participants
on public.project_shares
for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists project_shares_write_owner_admin on public.project_shares;
create policy project_shares_write_owner_admin
on public.project_shares
for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);
