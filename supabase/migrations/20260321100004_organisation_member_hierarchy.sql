-- Add organisation member hierarchy and granular creation permissions
--
-- DB CHANGES:
-- 1) Add can_create_projects and can_create_funding columns to organisation_members
-- 2) Backfill permissions for existing admin/owner roles
-- 3) Add indexes for efficient queries

-- 1) Add new permission columns
alter table public.organisation_members
  add column if not exists can_create_projects boolean not null default false,
  add column if not exists can_create_funding boolean not null default false;

-- 2) Backfill permissions for existing admin/owner roles
update public.organisation_members
set
  can_create_projects = true,
  can_create_funding = true
where role in ('admin', 'owner')
  and (can_create_projects = false or can_create_funding = false);

-- 3) Add helpful indexes
-- Note: organisation_members already has a UNIQUE index on (organisation_id, user_id)
-- as the primary key, which will serve lookups efficiently. Creating a duplicate
-- non-unique index as requested for consistency with requirements.
create index if not exists organisation_members_org_user_idx
  on public.organisation_members (organisation_id, user_id);

create index if not exists organisation_members_org_role_idx
  on public.organisation_members (organisation_id, role);
