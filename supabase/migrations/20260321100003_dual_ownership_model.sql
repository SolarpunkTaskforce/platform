-- Add dual ownership model to projects
-- Projects can be owned by either a user or an organisation
--
-- DB CHANGES:
-- 1) Remove existing FK constraint on owner_id (it currently points to auth.users)
-- 2) Add owner_type column
-- 3) Backfill existing rows with owner_type='user', ensure owner_id is set to created_by
-- 4) Add CHECK constraint on owner_type
-- 5) Make both columns NOT NULL
-- 6) Create composite index on (owner_type, owner_id)
--
-- NOTE: owner_id column already exists from 20260106160000_project_pages_slugs_visibility_shares.sql
-- We're repurposing it to work with dual ownership (user OR organisation)

-- 1) Drop existing FK constraint on owner_id (if it exists)
-- This allows owner_id to reference either auth.users OR organisations table
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'projects_owner_id_fkey'
  ) then
    alter table public.projects
      drop constraint projects_owner_id_fkey;
  end if;
end $$;

-- 2) Add owner_type column
alter table public.projects
  add column if not exists owner_type text;

-- 3) Backfill existing rows
-- Set owner_type='user' for all existing projects
-- Ensure owner_id is set (prefer created_by if owner_id is null)
-- 3) Backfill existing rows (robust)
-- 3a) Ensure owner_type is set
update public.projects
set owner_type = 'user'
where owner_type is null;

-- 3b) Backfill owner_id from created_by wherever possible
update public.projects
set owner_id = created_by
where owner_id is null
  and created_by is not null;

-- 3c) Fallback for legacy rows where created_by is null
-- Assign ownership to a deterministic platform admin/superadmin user.
do $$
declare
  fallback_owner uuid;
  remaining_nulls int;
begin
  select ur.user_id
    into fallback_owner
  from public.user_roles ur
  where ur.role in ('admin', 'superadmin')
  order by ur.created_at nulls last, ur.user_id
  limit 1;

  select count(*) into remaining_nulls
  from public.projects
  where owner_id is null;

  if remaining_nulls > 0 and fallback_owner is null then
    raise exception 'Cannot backfill projects.owner_id: found % projects with NULL owner_id but no admin/superadmin exists in public.user_roles', remaining_nulls;
  end if;

  if remaining_nulls > 0 then
    update public.projects
    set owner_type = coalesce(owner_type, 'user'),
        owner_id = fallback_owner
    where owner_id is null;
  end if;
end $$;


-- 4) Add CHECK constraint for owner_type
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_owner_type_check'
  ) then
    alter table public.projects
      add constraint projects_owner_type_check
      check (owner_type in ('user', 'organisation'));
  end if;
end $$;

-- 5) Make columns NOT NULL after backfill
alter table public.projects
  alter column owner_type set not null,
  alter column owner_id set not null;

-- 6) Create composite index for efficient queries by owner
create index if not exists projects_owner_idx
  on public.projects (owner_type, owner_id);
