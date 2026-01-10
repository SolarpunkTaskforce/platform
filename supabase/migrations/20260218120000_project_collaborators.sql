-- Project collaborators (sharing)

create table if not exists public.project_collaborators (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  primary key (project_id, user_id)
);

create index if not exists project_collaborators_user_id_idx
  on public.project_collaborators (user_id);

create index if not exists project_collaborators_project_id_idx
  on public.project_collaborators (project_id);

alter table public.project_collaborators enable row level security;

create or replace function public.user_can_view_project(pid uuid)
returns boolean
language sql
stable
set search_path to ''
as $$
  select
    exists (
      select 1
      from public.projects p
      where p.id = pid
        and p.status = 'approved'
    )
    or public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = pid
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_collaborators c
      where c.project_id = pid
        and c.user_id = auth.uid()
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
      from public.project_collaborators c
      where c.project_id = pid
        and c.user_id = auth.uid()
        and c.role = 'editor'
    )
    or exists (
      select 1
      from public.project_shares s
      where s.project_id = pid
        and s.user_id = auth.uid()
        and s.role = 'editor'
    );
$$;

create or replace function public.add_project_collaborator_by_email(
  pid uuid,
  email text,
  role text
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  normalized_role text := lower(coalesce(role, 'viewer'));
begin
  if normalized_role not in ('viewer', 'editor') then
    return 'not_allowed';
  end if;

  if not public.user_can_edit_project(pid) then
    return 'not_allowed';
  end if;

  select u.id
  into target_id
  from auth.users u
  where lower(u.email) = lower(email)
  limit 1;

  if target_id is null then
    return 'not_found';
  end if;

  insert into public.project_collaborators (project_id, user_id, role, created_by)
  values (pid, target_id, normalized_role, auth.uid())
  on conflict (project_id, user_id)
  do update set role = excluded.role;

  return 'ok';
end;
$$;

create or replace function public.get_project_collaborators(pid uuid)
returns table (
  user_id uuid,
  role text,
  created_at timestamptz,
  created_by uuid,
  full_name text,
  organisation_name text,
  email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    c.user_id,
    c.role,
    c.created_at,
    c.created_by,
    p.full_name,
    p.organisation_name,
    u.email
  from public.project_collaborators c
  left join public.profiles p on p.id = c.user_id
  left join auth.users u on u.id = c.user_id
  where c.project_id = pid
    and public.user_can_edit_project(pid);
$$;

-- Projects: view allowed if user_can_view_project
drop policy if exists projects_select_public_or_shared on public.projects;
create policy projects_select_public_or_shared
on public.projects
for select
using (public.user_can_view_project(id));

-- Collaborators: RLS policies
create policy project_collaborators_select_visible
on public.project_collaborators
for select
using (
  public.user_can_edit_project(project_id)
  or user_id = auth.uid()
);

create policy project_collaborators_insert_editors
on public.project_collaborators
for insert
with check (
  public.user_can_edit_project(project_id)
  and created_by = auth.uid()
);

create policy project_collaborators_update_editors
on public.project_collaborators
for update
using (public.user_can_edit_project(project_id))
with check (public.user_can_edit_project(project_id));

create policy project_collaborators_delete_editors_or_self
on public.project_collaborators
for delete
using (
  public.user_can_edit_project(project_id)
  or user_id = auth.uid()
);

grant execute on function public.add_project_collaborator_by_email(uuid, text, text) to authenticated;
grant execute on function public.get_project_collaborators(uuid) to authenticated;
