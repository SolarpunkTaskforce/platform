-- Add RLS policies for organisation_members table
-- Allows org admins/owners to manage members and permissions

-- 1) SELECT policy: Members can view other members of their organisations
drop policy if exists "org_members_read" on public.organisation_members;
create policy "org_members_read"
on public.organisation_members
for select
to authenticated
using (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_members.organisation_id
      and om.user_id = auth.uid()
  )
);

-- 2) UPDATE policy: Only admins/owners can update member roles and permissions
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
      and om.role in ('admin', 'owner')
  )
)
with check (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_members.organisation_id
      and om.user_id = auth.uid()
      and om.role in ('admin', 'owner')
  )
);

-- 3) DELETE policy: Only admins/owners can remove members
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
      and om.role in ('admin', 'owner')
  )
);
