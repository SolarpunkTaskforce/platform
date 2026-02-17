-- Migration: org_verified_gating_rls
-- Created: 2026-02-17T23:39:56.081Z
--
-- Update RLS policies to enforce SolTas org governance:
-- 1. Unverified orgs can edit profile but cannot create posts/projects/funding/issues
-- 2. Only verified orgs can create content
-- 3. Only members with explicit permission can create content on behalf of org
-- 4. Add RLS for organisation_member_requests and organisation_verification_submissions
-- 5. Update organisation_members RLS to require can_manage_members
-- 6. Remove all references to role='owner' from policies

begin;

-- ============================================================
-- 1) organisation_member_requests RLS
-- ============================================================

-- INSERT: authenticated user can create request for self (user_id = auth.uid())
drop policy if exists "organisation_member_requests_insert_self" on public.organisation_member_requests;
create policy "organisation_member_requests_insert_self"
on public.organisation_member_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
);

-- SELECT: requester can read own requests OR org admins can read requests for their org
drop policy if exists "organisation_member_requests_select_own_or_admin" on public.organisation_member_requests;
create policy "organisation_member_requests_select_own_or_admin"
on public.organisation_member_requests
for select
to authenticated
using (
  -- User can see their own requests
  user_id = auth.uid()
  or
  -- Org admins can see requests for their org
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_member_requests.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  )
);

-- UPDATE: org admins with can_manage_members=true can approve/reject
drop policy if exists "organisation_member_requests_update_admin" on public.organisation_member_requests;
create policy "organisation_member_requests_update_admin"
on public.organisation_member_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_member_requests.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  )
)
with check (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_member_requests.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  )
);

-- DELETE: requester can delete their own pending request
drop policy if exists "organisation_member_requests_delete_own" on public.organisation_member_requests;
create policy "organisation_member_requests_delete_own"
on public.organisation_member_requests
for delete
to authenticated
using (
  user_id = auth.uid()
  and status = 'pending'
);

-- ============================================================
-- 2) organisation_verification_submissions RLS
-- ============================================================

-- INSERT: org admins can submit for their org
drop policy if exists "organisation_verification_submissions_insert_admin" on public.organisation_verification_submissions;
create policy "organisation_verification_submissions_insert_admin"
on public.organisation_verification_submissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_verification_submissions.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  )
  and submitted_by = auth.uid()
  and status = 'pending'
);

-- SELECT: org admins can view submissions for their org OR SolTas admins/superadmins can view all
drop policy if exists "organisation_verification_submissions_select_admin_or_soltas" on public.organisation_verification_submissions;
create policy "organisation_verification_submissions_select_admin_or_soltas"
on public.organisation_verification_submissions
for select
to authenticated
using (
  -- SolTas admins/superadmins can view all
  public.is_admin()
  or
  -- Org admins can view submissions for their org
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_verification_submissions.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  )
);

-- UPDATE: SolTas admins/superadmins can approve/reject
drop policy if exists "organisation_verification_submissions_update_soltas_admin" on public.organisation_verification_submissions;
create policy "organisation_verification_submissions_update_soltas_admin"
on public.organisation_verification_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 3) organisation_members RLS tightening
-- Remove references to role='owner', require can_manage_members
-- ============================================================

-- UPDATE: org admins with can_manage_members=true can update
drop policy if exists "org_members_update_admin" on public.organisation_members;
create policy "org_members_update_admin"
on public.organisation_members
for update
to authenticated
using (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_members.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  )
)
with check (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_members.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  )
);

-- DELETE: org admins with can_manage_members=true can delete
drop policy if exists "org_members_delete_admin" on public.organisation_members;
create policy "org_members_delete_admin"
on public.organisation_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_members.organisation_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  )
);

-- ============================================================
-- 4) feed_posts RLS: enforce org verification + can_post_feed
-- Remove 'owner' role references
-- ============================================================

-- INSERT: require verified org + can_post_feed permission
drop policy if exists "feed_posts_insert_auth" on public.feed_posts;
create policy "feed_posts_insert_auth"
on public.feed_posts
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    -- Personal post (no org)
    author_organisation_id is null
    or
    -- Org post: org must be verified AND user must have can_post_feed permission
    exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = feed_posts.author_organisation_id
        and om.user_id = auth.uid()
        and om.can_post_feed = true
        and o.verification_status = 'verified'
    )
  )
);

-- UPDATE: same rules, remove 'owner' role reference
drop policy if exists "feed_posts_update_auth" on public.feed_posts;
create policy "feed_posts_update_auth"
on public.feed_posts
for update
to authenticated
using (
  created_by = auth.uid()
  and (
    author_organisation_id is null
    or
    exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = feed_posts.author_organisation_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
    )
  )
)
with check (
  created_by = auth.uid()
  and (
    author_organisation_id is null
    or
    exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = feed_posts.author_organisation_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
    )
  )
);

-- DELETE: same as UPDATE
drop policy if exists "feed_posts_delete_auth" on public.feed_posts;
create policy "feed_posts_delete_auth"
on public.feed_posts
for delete
to authenticated
using (
  created_by = auth.uid()
  and (
    author_organisation_id is null
    or
    exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = feed_posts.author_organisation_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
    )
  )
);

-- ============================================================
-- 5) grants RLS: enforce org verification + can_create_funding
-- Remove 'owner' role references
-- ============================================================

-- INSERT: require verified org + can_create_funding permission
drop policy if exists "grants_insert_dual_ownership" on public.grants;
create policy "grants_insert_dual_ownership"
on public.grants
for insert
to authenticated
with check (
  -- Case A: User-owned grant
  (owner_type = 'user' and owner_id = auth.uid())
  or
  -- Case B: Organisation-owned grant
  -- Org must be verified AND user must have can_create_funding permission
  (
    owner_type = 'organisation'
    and exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.can_create_funding = true
        and o.verification_status = 'verified'
    )
  )
);

-- UPDATE: org admin only (remove 'owner' role reference), require verified org
drop policy if exists "grants_update_dual_ownership" on public.grants;
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
  -- Organisation-owned grants: org admin can update (must be verified)
  (
    owner_type = 'organisation'
    and exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
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
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
    )
  )
);

-- DELETE: same as UPDATE (remove 'owner' role reference)
drop policy if exists "grants_delete_dual_ownership" on public.grants;
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
  -- Organisation-owned grants: org admin can delete
  (
    owner_type = 'organisation'
    and exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
);

-- ============================================================
-- 6) watchdog_issues RLS: enforce org verification + can_create_issues
-- Remove 'owner' role references
-- ============================================================

-- INSERT: require verified org + can_create_issues permission
drop policy if exists "watchdog_issues_insert_dual_ownership" on public.watchdog_issues;
create policy "watchdog_issues_insert_dual_ownership"
on public.watchdog_issues
for insert
to authenticated
with check (
  -- Status must be pending for new inserts
  status = 'pending'
  and
  (
    -- Case A: User-owned issue (anyone can create)
    (owner_type = 'user' and owner_id = auth.uid())
    or
    -- Case B: Organisation-owned issue
    -- Org must be verified AND user must have can_create_issues permission
    (
      owner_type = 'organisation'
      and exists (
        select 1
        from public.organisation_members om
        join public.organisations o on o.id = om.organisation_id
        where om.organisation_id = owner_id
          and om.user_id = auth.uid()
          and om.can_create_issues = true
          and o.verification_status = 'verified'
      )
    )
  )
);

-- UPDATE: org admin only (remove 'owner' role reference), require verified org
drop policy if exists "watchdog_issues_update_dual_ownership" on public.watchdog_issues;
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
  -- Organisation-owned issues: org admin can update pending issues (must be verified)
  (
    owner_type = 'organisation'
    and status = 'pending'
    and exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
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
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
    )
  )
);

-- ============================================================
-- 7) projects RLS: enforce org verification + can_create_projects
-- Remove 'owner' role references
-- ============================================================

-- INSERT: require verified org + can_create_projects permission
drop policy if exists "projects_insert_dual_ownership" on public.projects;
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
    -- Org must be verified AND user must have can_create_projects permission
    (
      owner_type = 'organisation'
      and exists (
        select 1
        from public.organisation_members om
        join public.organisations o on o.id = om.organisation_id
        where om.organisation_id = owner_id
          and om.user_id = auth.uid()
          and om.can_create_projects = true
          and o.verification_status = 'verified'
      )
    )
  )
);

-- UPDATE: org admin only (remove 'owner' role reference), require verified org
drop policy if exists "projects_update_dual_ownership" on public.projects;
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
  -- Organisation-owned projects: org admin can update (must be verified)
  (
    owner_type = 'organisation'
    and exists (
      select 1
      from public.organisation_members om
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
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
      join public.organisations o on o.id = om.organisation_id
      where om.organisation_id = owner_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and o.verification_status = 'verified'
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
-- SUMMARY OF CHANGES:
--
-- 1. organisation_member_requests RLS (NEW):
--    - INSERT: authenticated user can create request for self
--    - SELECT: requester can read own requests, org admins can read requests for their org
--    - UPDATE: org admins with can_manage_members=true can approve/reject
--    - DELETE: requester can delete their own pending request
--
-- 2. organisation_verification_submissions RLS (NEW):
--    - INSERT: org admins can submit for their org
--    - SELECT: org admins can view submissions for their org, SolTas admins/superadmins can view all
--    - UPDATE: SolTas admins/superadmins can approve/reject
--
-- 3. organisation_members RLS (UPDATED):
--    - UPDATE/DELETE: now require can_manage_members=true (in addition to admin role)
--    - Removed all references to role='owner'
--
-- 4. feed_posts RLS (UPDATED):
--    - INSERT: org posts require verification_status='verified' AND can_post_feed=true
--    - UPDATE/DELETE: org posts require verification_status='verified' AND admin role (removed 'owner')
--
-- 5. grants RLS (UPDATED):
--    - INSERT: org-owned require verification_status='verified' AND can_create_funding=true
--    - UPDATE: org-owned require verification_status='verified' AND admin role (removed 'owner')
--    - DELETE: removed 'owner' role reference
--
-- 6. watchdog_issues RLS (UPDATED):
--    - INSERT: org-owned require verification_status='verified' AND can_create_issues=true
--    - UPDATE: org-owned require verification_status='verified' AND admin role (removed 'owner')
--
-- 7. projects RLS (UPDATED):
--    - INSERT: org-owned require verification_status='verified' AND can_create_projects=true
--    - UPDATE: org-owned require verification_status='verified' AND admin role (removed 'owner')
--
-- ACCEPTANCE TESTS:
-- [ ] Unverified org admin cannot create org-owned feed post
-- [ ] Verified org admin without can_post_feed cannot create org-owned feed post
-- [ ] Verified org admin with can_post_feed can create org-owned feed post
-- [ ] Unverified org admin cannot create org-owned project
-- [ ] Verified org admin without can_create_projects cannot create org-owned project
-- [ ] Verified org admin with can_create_projects can create org-owned project
-- [ ] User can create request to join org
-- [ ] Org admin with can_manage_members can approve member request
-- [ ] Org admin without can_manage_members cannot approve member request
-- [ ] Org admin can submit verification for their org
-- [ ] SolTas admin can approve verification submission
