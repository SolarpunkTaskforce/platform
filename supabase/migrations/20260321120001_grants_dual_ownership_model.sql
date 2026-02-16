-- Add dual ownership model to grants (funding opportunities)
-- Grants can be owned by either a user or an organisation
--
-- DB CHANGES:
-- 1) Remove existing FK constraint on created_by (we'll repurpose this as creator, not owner)
-- 2) Add owner_type column
-- 3) Add owner_id column
-- 4) Backfill existing rows with owner_type='user', owner_id=created_by
-- 5) Add CHECK constraint on owner_type
-- 6) Make both columns NOT NULL
-- 7) Create composite index on (owner_type, owner_id)
--
-- CONTEXT:
-- This follows the same dual ownership pattern implemented for projects in
-- 20260321100003_dual_ownership_model.sql. The grants table represents funding
-- opportunities and should support both user-owned and organisation-owned entries.

begin;

-- 1) Add owner_type column
alter table public.grants
  add column if not exists owner_type text;

-- 2) Add owner_id column
alter table public.grants
  add column if not exists owner_id uuid;

-- 3) Backfill existing rows
-- Set owner_type='user' for all existing grants
-- Set owner_id to created_by (existing creator becomes owner)
update public.grants
set owner_type = 'user'
where owner_type is null;

update public.grants
set owner_id = created_by
where owner_id is null
  and created_by is not null;

-- 3b) Fallback for legacy rows where created_by is null (unlikely but defensive)
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
  from public.grants
  where owner_id is null;

  if remaining_nulls > 0 and fallback_owner is null then
    raise exception 'Cannot backfill grants.owner_id: found % grants with NULL owner_id but no admin/superadmin exists in public.user_roles', remaining_nulls;
  end if;

  if remaining_nulls > 0 then
    update public.grants
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
    where conname = 'grants_owner_type_check'
  ) then
    alter table public.grants
      add constraint grants_owner_type_check
      check (owner_type in ('user', 'organisation'));
  end if;
end $$;

-- 5) Make columns NOT NULL after backfill
alter table public.grants
  alter column owner_type set not null,
  alter column owner_id set not null;

-- 6) Create composite index for efficient queries by owner
create index if not exists grants_owner_idx
  on public.grants (owner_type, owner_id);

commit;
