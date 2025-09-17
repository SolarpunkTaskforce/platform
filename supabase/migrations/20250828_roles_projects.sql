-- Ensure profiles.role exists
do 22942
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = public and table_name = profiles and column_name = role
  ) then
    alter table public.profiles add column role text;
  end if;
end22942;

-- Ensure is_admin(uid) exists
do 22942
begin
  if not exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = public and p.proname = is_admin
  ) then
    create function public.is_admin(uid uuid default auth.uid())
    returns boolean
    language sql stable
    as 22942
      select exists (
        select 1 from public.profiles pr
        where pr.id = uid and pr.role in (admin,superadmin)
      );
    22942;
  end if;
end22942;

-- Recreate policy using is_admin(); drop only if it exists
do 22942
begin
  if exists (
    select 1 from pg_policies
    where schemaname = public and tablename = profiles and policyname = profiles_public_read_admin_only
  ) then
    drop policy "profiles_public_read_admin_only" on public.profiles;
  end if;

  create policy "profiles_public_read_admin_only"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));
end22942;
-- enums
create type user_role as enum ('admin','member');
create type project_status as enum ('pending','approved','rejected');

-- profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  role user_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_read" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_self_update" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_public_read_admin_only" on public.profiles
for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  org_name text,
  status project_status not null default 'pending',
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz
);

alter table public.projects enable row level security;

-- Public can read only approved
create policy "projects_public_read_approved_only" on public.projects
for select using (status = 'approved');

-- Creators can read their own pending/rejected
create policy "projects_creator_read_own" on public.projects
for select using (auth.uid() = created_by);

-- Creators can insert pending items only for themselves
create policy "projects_creator_insert_pending" on public.projects
for insert to authenticated
with check (
  auth.uid() = created_by
  and status = 'pending'
);

-- Creators can update their own pending items (not status/approval fields)
create policy "projects_creator_update_pending_own" on public.projects
for update to authenticated
using (auth.uid() = created_by and status = 'pending')
with check (
  auth.uid() = created_by
  and status = 'pending'
);

-- Admin approval policy: only admins can set status and approval fields
create or replace function public.is_admin(uid uuid) returns boolean
language sql stable as $$
  select exists(
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

create policy "projects_admin_full_access" on public.projects
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Prevent non-admin edits of status/approval via column-level security-ish trigger
create or replace function public.enforce_status_changes()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE') then
    if (new.status <> old.status or new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at) then
      if not public.is_admin(auth.uid()) then
        raise exception 'only admins can change approval fields';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_status on public.projects;
create trigger trg_enforce_status
before update on public.projects
for each row execute function public.enforce_status_changes();

-- Helpful indexes
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_coords_idx on public.projects (lat, lng);
create index if not exists projects_created_by_idx on public.projects(created_by);
