-- Update RLS policies for public.projects to enforce dual ownership + org permissions
--
-- CONTEXT:
-- The dual ownership model was introduced in 20260321100003_dual_ownership_model.sql
-- Organisation member hierarchy with can_create_projects was added in 20260321100004_organisation_member_hierarchy.sql
-- This migration updates INSERT and UPDATE policies to properly enforce dual ownership rules.
--
-- CHANGES:
-- 1) Drop outdated INSERT policy (projects_insert)
-- 2) Drop outdated UPDATE policies (projects_update_owner, projects_update_admin)
-- 3) Create new INSERT policy: projects_insert_dual_ownership
--    - Allows user-owned projects if owner_type='user' AND owner_id = auth.uid()
--    - Allows org-owned projects if owner_type='organisation' AND user is org member with can_create_projects=true
-- 4) Create new UPDATE policy: projects_update_dual_ownership
--    - For user-owned: owner_id = auth.uid()
--    - For org-owned: user is admin/owner OR has editor role via collaborators/shares
-- 5) Keep SELECT policy unchanged (projects_select_public_or_shared uses user_can_view_project)
-- 6) Keep DELETE policies unchanged (already handled by projects_delete_owner and projects_delete_admin)
--
-- SECURITY:
-- - No weakening of security
-- - Enforces organisation membership and can_create_projects for org-owned projects
-- - Maintains admin override capabilities
--

begin;

-- 1) Drop existing INSERT policy
-- Original policy: auth.uid() = created_by and status = 'pending'
-- This is insufficient for dual ownership model
drop policy if exists "projects_insert" on public.projects;

-- 2) Drop existing UPDATE policies
-- These were based on created_by, not the new owner_id/owner_type model
drop policy if exists "projects_update_owner" on public.projects;
drop policy if exists "projects_update_admin" on public.projects;

-- Note: We also drop the newer policy that was added by project_pages migration
drop policy if exists "projects_update_owner_admin_editor" on public.projects;

-- 3) Create new INSERT policy for dual ownership
create policy "projects_insert_dual_ownership"
on public.projects
for insert
to authenticated
with check (
  -- Status must be pending for new inserts
  status = 'pending'
  and
  (
    -- Case A: User-owned project
    (owner_type = 'user' and owner_id = auth.uid())
    or
    -- Case B: Organisation-owned project
    -- User must be a member with can_create_projects permission
    (
      owner_type = 'organisation'
      and exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = owner_id
          and om.user_id = auth.uid()
          and om.can_create_projects = true
      )
    )
  )
);

-- 4) Create new UPDATE policy for dual ownership
create policy "projects_update_dual_ownership"
on public.projects
for update
to authenticated
using (
  -- Admins can update any project
  public.is_admin()
  or
  -- User-owned projects: owner can update
  (owner_type = 'user' and owner_id = auth.uid())
  or
  -- Organisation-owned projects: org admin/owner can update
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
  or
  -- Project editors (via collaborators or shares) can update
  exists (
    select 1
    from public.project_collaborators c
    where c.project_id = id
      and c.user_id = auth.uid()
      and c.role = 'editor'
  )
  or
  exists (
    select 1
    from public.project_shares s
    where s.project_id = id
      and s.user_id = auth.uid()
      and s.role = 'editor'
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
  or
  exists (
    select 1
    from public.project_collaborators c
    where c.project_id = id
      and c.user_id = auth.uid()
      and c.role = 'editor'
  )
  or
  exists (
    select 1
    from public.project_shares s
    where s.project_id = id
      and s.user_id = auth.uid()
      and s.role = 'editor'
  )
);

commit;

-- DOCUMENTATION:
--
-- Policies Removed:
-- 1. projects_insert (old policy based on created_by)
-- 2. projects_update_owner (old policy based on created_by + status)
-- 3. projects_update_admin (old admin-only update policy)
-- 4. projects_update_owner_admin_editor (newer policy from project_pages, replaced)
--
-- Policies Added:
-- 1. projects_insert_dual_ownership
--    - Enforces status='pending' for all new projects
--    - User-owned: owner_type='user' AND owner_id=auth.uid()
--    - Org-owned: owner_type='organisation' AND user has can_create_projects=true
--
-- 2. projects_update_dual_ownership
--    - Admins can update any project
--    - User-owned: owner_id=auth.uid()
--    - Org-owned: user is admin/owner in the organisation
--    - Project editors: via project_collaborators or project_shares with role='editor'
--
-- Policies Unchanged:
-- 1. projects_select_public_or_shared (SELECT policy using user_can_view_project)
-- 2. projects_delete_owner (DELETE policy for pending projects owned by user)
-- 3. projects_delete_admin (DELETE policy for admin users)
--
-- Acceptance Tests (Manual):
-- [ ] Logged out user cannot insert project
-- [ ] Authenticated user can insert user-owned project (owner_type='user', owner_id=auth.uid())
-- [ ] Org member WITHOUT can_create_projects=true cannot insert org-owned project
-- [ ] Org member WITH can_create_projects=true can insert org-owned project
-- [ ] Org admin can update org-owned project
-- [ ] User can update their own user-owned project
-- [ ] Editor collaborator can update project (both user and org-owned)
