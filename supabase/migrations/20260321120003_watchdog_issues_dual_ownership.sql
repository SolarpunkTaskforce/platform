-- Add dual ownership model to watchdog_issues
-- Issues can be owned by either a user or an organisation
--
-- DB CHANGES:
-- 1) Add owner_type column
-- 2) Add owner_id column
-- 3) Backfill existing rows with owner_type='user', owner_id=created_by
-- 4) Add CHECK constraint on owner_type
-- 5) Make both columns NOT NULL
-- 6) Create composite index on (owner_type, owner_id)
-- 7) Update RLS policies to enforce dual ownership rules
--
-- RLS RULES:
-- - Anyone (authenticated user) can create issues as an individual (owner_type='user', owner_id=auth.uid())
-- - Only org admins/owners can create issues on behalf of an organisation (owner_type='organisation')
-- - Issues are allowed for ALL users; no can_create flag required for user-owned issues
--
-- ACCEPTANCE:
-- - Any authenticated user can create a personal issue
-- - Only org admins/owners can create org-attributed issue
-- - Logged out cannot create

begin;

-- 1) Add owner_type column
alter table public.watchdog_issues
  add column if not exists owner_type text;

-- 2) Add owner_id column
alter table public.watchdog_issues
  add column if not exists owner_id uuid;

-- 3) Backfill existing rows
-- Set owner_type='user' for all existing watchdog issues
-- Set owner_id=created_by for all existing watchdog issues
update public.watchdog_issues
set owner_type = 'user'
where owner_type is null;

update public.watchdog_issues
set owner_id = created_by
where owner_id is null;

-- 4) Add CHECK constraint for owner_type
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'watchdog_issues_owner_type_check'
  ) then
    alter table public.watchdog_issues
      add constraint watchdog_issues_owner_type_check
      check (owner_type in ('user', 'organisation'));
  end if;
end $$;

-- 5) Make columns NOT NULL after backfill
alter table public.watchdog_issues
  alter column owner_type set not null,
  alter column owner_id set not null;

-- 6) Create composite index for efficient queries by owner
create index if not exists watchdog_issues_owner_idx
  on public.watchdog_issues (owner_type, owner_id);

-- 7) Update RLS policies for dual ownership
-- Drop existing INSERT policy
drop policy if exists "Users can insert watchdog issues" on public.watchdog_issues;

-- Drop existing UPDATE policy
drop policy if exists "Users can update pending watchdog issues" on public.watchdog_issues;

-- Create new INSERT policy for dual ownership
create policy "watchdog_issues_insert_dual_ownership"
on public.watchdog_issues
for insert
to authenticated
with check (
  -- Status must be pending for new inserts
  status = 'pending'
  and
  (
    -- Case A: User-owned issue
    -- Anyone (authenticated user) can create issues as an individual
    (owner_type = 'user' and owner_id = auth.uid())
    or
    -- Case B: Organisation-owned issue
    -- Only org admins/owners can create issues on behalf of an organisation
    (
      owner_type = 'organisation'
      and exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = owner_id
          and om.user_id = auth.uid()
          and om.role in ('admin', 'owner')
      )
    )
  )
);

-- Create new UPDATE policy for dual ownership
create policy "watchdog_issues_update_dual_ownership"
on public.watchdog_issues
for update
to authenticated
using (
  -- Admins can update any watchdog issue
  public.is_admin()
  or
  -- User-owned issues: user can only update their own pending issues
  (owner_type = 'user' and owner_id = auth.uid() and status = 'pending')
  or
  -- Organisation-owned issues: org admin/owner can update pending issues
  (
    owner_type = 'organisation'
    and status = 'pending'
    and exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'owner')
    )
  )
)
with check (
  -- Same rules for the new values
  public.is_admin()
  or
  (owner_type = 'user' and owner_id = auth.uid() and status = 'pending')
  or
  (
    owner_type = 'organisation'
    and status = 'pending'
    and exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'owner')
    )
  )
);

commit;

-- DOCUMENTATION:
--
-- Policies Removed:
-- 1. "Users can insert watchdog issues" (old policy based on created_by)
-- 2. "Users can update pending watchdog issues" (old policy based on created_by)
--
-- Policies Added:
-- 1. watchdog_issues_insert_dual_ownership
--    - User-owned: owner_type='user' AND owner_id=auth.uid() (any authenticated user)
--    - Org-owned: owner_type='organisation' AND user is org admin/owner
--
-- 2. watchdog_issues_update_dual_ownership
--    - Admins can update any watchdog issue
--    - User-owned: owner_id=auth.uid() AND status='pending'
--    - Org-owned: user is admin/owner in the organisation AND status='pending'
--
-- Policies Unchanged:
-- 1. "Public can read approved watchdog issues" (SELECT policy)
-- 2. "Users can read own watchdog issues" (SELECT policy)
-- 3. "Admins can manage watchdog issues" (admin override policy for all operations)
--
-- Acceptance Tests (Manual):
-- [ ] Logged out user cannot insert watchdog issue
-- [ ] Authenticated user can insert user-owned issue (owner_type='user', owner_id=auth.uid())
-- [ ] Org member WITHOUT admin/owner role cannot insert org-owned issue
-- [ ] Org admin/owner can insert org-owned issue
-- [ ] User can update their own pending user-owned issue
-- [ ] Org admin can update pending org-owned issue
-- [ ] Admin can update any watchdog issue
