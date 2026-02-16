-- Update RLS policies for public.grants to enforce dual ownership + org permissions
--
-- CONTEXT:
-- The dual ownership model was introduced in 20260216232939_grants_dual_ownership_model.sql
-- Organisation member hierarchy with can_create_funding was added in 20260321100004_organisation_member_hierarchy.sql
-- This migration updates INSERT and UPDATE policies to properly enforce dual ownership rules.
--
-- CHANGES:
-- 1) Drop outdated INSERT policy (Users can insert own grants)
-- 2) Drop outdated UPDATE policy (Users can update own grants)
-- 3) Create new INSERT policy: grants_insert_dual_ownership
--    - Allows user-owned grants if owner_type='user' AND owner_id = auth.uid()
--    - Allows org-owned grants if owner_type='organisation' AND user is org member with can_create_funding=true
-- 4) Create new UPDATE policy: grants_update_dual_ownership
--    - For user-owned: owner_id = auth.uid()
--    - For org-owned: user is admin/owner in the organisation
-- 5) Keep SELECT policy unchanged (public read for published grants)
-- 6) Update DELETE policy to use owner_type/owner_id instead of created_by
--
-- SECURITY:
-- - No weakening of security
-- - Enforces organisation membership and can_create_funding for org-owned grants
-- - Maintains admin override capabilities
--

begin;

-- 1) Drop existing INSERT policy
-- Original policy: created_by = auth.uid()
-- This is insufficient for dual ownership model
drop policy if exists "Users can insert own grants" on public.grants;

-- 2) Drop existing UPDATE policy
-- These were based on created_by, not the new owner_id/owner_type model
drop policy if exists "Users can update own grants" on public.grants;

-- 3) Drop existing DELETE policy (we'll recreate it with dual ownership)
drop policy if exists "Users can delete own grants" on public.grants;

-- 4) Create new INSERT policy for dual ownership
create policy "grants_insert_dual_ownership"
on public.grants
for insert
to authenticated
with check (
  -- Case A: User-owned grant
  (owner_type = 'user' and owner_id = auth.uid())
  or
  -- Case B: Organisation-owned grant
  -- User must be a member with can_create_funding permission
  (
    owner_type = 'organisation'
    and exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.can_create_funding = true
    )
  )
);

-- 5) Create new UPDATE policy for dual ownership
create policy "grants_update_dual_ownership"
on public.grants
for update
to authenticated
using (
  -- Admins can update any grant
  public.is_admin()
  or
  -- User-owned grants: owner can update
  (owner_type = 'user' and owner_id = auth.uid())
  or
  -- Organisation-owned grants: org admin/owner can update
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
with check (
  -- Same rules for the new values
  public.is_admin()
  or
  (owner_type = 'user' and owner_id = auth.uid())
  or
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
);

-- 6) Create new DELETE policy for dual ownership
create policy "grants_delete_dual_ownership"
on public.grants
for delete
to authenticated
using (
  -- Admins can delete any grant
  public.is_admin()
  or
  -- User-owned grants: owner can delete
  (owner_type = 'user' and owner_id = auth.uid())
  or
  -- Organisation-owned grants: org admin/owner can delete
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
);

commit;

-- DOCUMENTATION:
--
-- Policies Removed:
-- 1. "Users can insert own grants" (old policy based on created_by)
-- 2. "Users can update own grants" (old policy based on created_by)
-- 3. "Users can delete own grants" (old policy based on created_by)
--
-- Policies Added:
-- 1. grants_insert_dual_ownership
--    - User-owned: owner_type='user' AND owner_id=auth.uid()
--    - Org-owned: owner_type='organisation' AND user has can_create_funding=true
--
-- 2. grants_update_dual_ownership
--    - Admins can update any grant
--    - User-owned: owner_id=auth.uid()
--    - Org-owned: user is admin/owner in the organisation
--
-- 3. grants_delete_dual_ownership
--    - Admins can delete any grant
--    - User-owned: owner_id=auth.uid()
--    - Org-owned: user is admin/owner in the organisation
--
-- Policies Unchanged:
-- 1. "Public can read published open grants" (SELECT policy)
-- 2. "Admins can manage grants" (admin override policy)
--
-- Acceptance Tests (Manual):
-- [ ] Logged out user cannot insert grant
-- [ ] Authenticated user can insert user-owned grant (owner_type='user', owner_id=auth.uid())
-- [ ] Org member WITHOUT can_create_funding=true cannot insert org-owned grant
-- [ ] Org member WITH can_create_funding=true can insert org-owned grant
-- [ ] Org admin can update org-owned grant
-- [ ] User can update their own user-owned grant
-- [ ] Org admin can delete org-owned grant
-- [ ] User can delete their own user-owned grant
