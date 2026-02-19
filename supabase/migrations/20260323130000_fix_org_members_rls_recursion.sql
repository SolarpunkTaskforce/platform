begin;

-- Fix: infinite recursion in RLS policies on public.organisation_members
-- Approach: use SECURITY DEFINER helper functions (owned by migration role) to check membership/admin
-- without the policy directly querying organisation_members.

create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = _org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin_can_manage_members(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = _org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.can_manage_members = true
  );
$$;

-- Recreate policies to avoid self-referential queries (no recursion)
drop policy if exists "org_members_read" on public.organisation_members;
create policy "org_members_read"
on public.organisation_members
for select
to authenticated
using (
  public.is_org_member(organisation_id)
);

drop policy if exists "org_members_update_admin" on public.organisation_members;
create policy "org_members_update_admin"
on public.organisation_members
for update
to authenticated
using (
  public.is_org_admin_can_manage_members(organisation_id)
)
with check (
  public.is_org_admin_can_manage_members(organisation_id)
);

drop policy if exists "org_members_delete_admin" on public.organisation_members;
create policy "org_members_delete_admin"
on public.organisation_members
for delete
to authenticated
using (
  public.is_org_admin_can_manage_members(organisation_id)
);

commit;
