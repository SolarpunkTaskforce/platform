-- Migration: admin_registration_workflows
-- Created: 2026-03-23T13:00:01.000Z
--
-- HIGH-RISK: Database schema change (forward-only).
--
-- OBJECTIVE:
-- Implement admin moderation workflows for grants and organisations.
-- Mirror the moderation pattern used by watchdog_issues (status + approved/rejected metadata).
--
-- CHANGES:
-- A) grants table:
--    - Add moderation_status (separate from business 'status' field which tracks open/closed/rolling)
--    - Add approved_at, approved_by, rejected_at, rejected_by, rejection_reason
--    - Add CHECK constraint for moderation_status IN ('pending','approved','rejected')
--    - Update SELECT RLS to restrict public access to approved grants only
--    - Add moderation trigger to enforce admin-only changes to moderation fields
--
-- B) organisations table:
--    - Add rejected_at, rejected_by, rejection_reason (verification_status already exists)
--    - Add moderation trigger to enforce admin-only changes to verification fields
--
-- C) Moderation enforcement:
--    - Apply enforce_moderation_by_admin trigger to both tables
--    - Ensures only admins can change moderation/verification fields
--
-- SECURITY:
-- - No weakening of security
-- - Public access to grants restricted to approved items only
-- - Moderation fields can only be changed by admins (DB-enforced)
-- - All existing policies preserved or strengthened

begin;

-- ============================================================
-- A) grants table: Add moderation fields
-- ============================================================

-- Add moderation_status (separate from business status: open/closed/rolling)
alter table public.grants
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id),
  add column if not exists rejection_reason text;

-- Add CHECK constraint for moderation_status
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'grants_moderation_status_check'
  ) then
    alter table public.grants
      add constraint grants_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Create index for moderation_status filtering
create index if not exists grants_moderation_status_idx
  on public.grants (moderation_status);

-- ============================================================
-- B) organisations table: Add rejection fields
-- ============================================================

-- verification_status, verified_at, verified_by already exist
-- Add rejection metadata to complete the pattern
alter table public.organisations
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id),
  add column if not exists rejection_reason text;

-- ============================================================
-- C) grants RLS: Update SELECT policy for moderation
-- ============================================================

-- Current policy: "Public can read published open grants"
-- New requirement: Public can only read APPROVED grants
-- Owners can see their own (any status)
-- Admins can see all

-- Drop old SELECT policies for grants
drop policy if exists "Public can read published open grants" on public.grants;

-- New SELECT policies that respect moderation_status

-- 1. Public can read approved grants that are published and open/rolling
create policy "grants_select_public_approved"
on public.grants
for select
using (
  moderation_status = 'approved'
  and is_published = true
  and status in ('open', 'rolling')
);

-- 2. Owners can read their own grants (any moderation_status)
-- For user-owned grants
create policy "grants_select_user_owned"
on public.grants
for select
to authenticated
using (
  owner_type = 'user'
  and owner_id = auth.uid()
);

-- 3. Organisation admins can read their org's grants (any moderation_status)
create policy "grants_select_org_owned"
on public.grants
for select
to authenticated
using (
  owner_type = 'organisation'
  and exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = owner_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  )
);

-- 4. Admins can read all grants (already exists via "Admins can manage grants")
-- Keep the existing admin policy as-is

-- ============================================================
-- D) Moderation enforcement triggers
-- ============================================================

-- Apply enforce_moderation_by_admin trigger to grants
-- This trigger already exists (created in 20260106130000_fix_enforce_moderation_trigger.sql)
-- It checks: status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason
-- We need to extend it to also check moderation_status for grants

-- Create a grants-specific moderation trigger that checks moderation_status
create or replace function public.enforce_grants_moderation_by_admin()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- If someone is trying to change moderation-related fields,
  -- require admin privileges.
  if
    (new.moderation_status is distinct from old.moderation_status)
    or (new.approved_at is distinct from old.approved_at)
    or (new.approved_by is distinct from old.approved_by)
    or (new.rejected_at is distinct from old.rejected_at)
    or (new.rejected_by is distinct from old.rejected_by)
    or (new.rejection_reason is distinct from old.rejection_reason)
  then
    if not public.is_admin() then
      raise exception 'Only admins may approve or reject grants'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Attach trigger to grants table
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'grants_enforce_moderation_by_admin'
  ) then
    create trigger grants_enforce_moderation_by_admin
    before update on public.grants
    for each row
    execute function public.enforce_grants_moderation_by_admin();
  end if;
end $$;

-- Apply moderation trigger to organisations table
-- This checks verification_status, verified_at, verified_by, rejected_at, rejected_by, rejection_reason
create or replace function public.enforce_organisations_moderation_by_admin()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- If someone is trying to change verification-related fields,
  -- require admin privileges.
  if
    (new.verification_status is distinct from old.verification_status)
    or (new.verified_at is distinct from old.verified_at)
    or (new.verified_by is distinct from old.verified_by)
    or (new.rejected_at is distinct from old.rejected_at)
    or (new.rejected_by is distinct from old.rejected_by)
    or (new.rejection_reason is distinct from old.rejection_reason)
  then
    if not public.is_admin() then
      raise exception 'Only admins may verify or reject organisations'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Attach trigger to organisations table
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'organisations_enforce_moderation_by_admin'
  ) then
    create trigger organisations_enforce_moderation_by_admin
    before update on public.organisations
    for each row
    execute function public.enforce_organisations_moderation_by_admin();
  end if;
end $$;

commit;

-- ============================================================
-- DOCUMENTATION
-- ============================================================
--
-- Tables Modified:
-- 1. public.grants
--    - Added columns: moderation_status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason
--    - Added constraint: grants_moderation_status_check
--    - Added index: grants_moderation_status_idx
--    - Added trigger: grants_enforce_moderation_by_admin
--
-- 2. public.organisations
--    - Added columns: rejected_at, rejected_by, rejection_reason
--    - Added trigger: organisations_enforce_moderation_by_admin
--
-- RLS Policies Modified:
-- 1. public.grants SELECT policies:
--    - Dropped: "Public can read published open grants"
--    - Added: "grants_select_public_approved" (public sees only approved grants)
--    - Added: "grants_select_user_owned" (users see their own grants)
--    - Added: "grants_select_org_owned" (org admins see org grants)
--    - Preserved: "Admins can manage grants" (admins see all)
--
-- Functions Created:
-- 1. public.enforce_grants_moderation_by_admin() - Enforces admin-only changes to grants moderation fields
-- 2. public.enforce_organisations_moderation_by_admin() - Enforces admin-only changes to organisation verification fields
--
-- Security Guarantees:
-- 1. Public cannot see pending/rejected grants (only approved + published + open/rolling)
-- 2. Public cannot see pending/rejected organisations (existing RLS already enforces verified-only)
-- 3. Only admins can change moderation fields in grants (DB-enforced via trigger)
-- 4. Only admins can change verification fields in organisations (DB-enforced via trigger)
-- 5. No existing policies weakened - only strengthened or preserved
--
-- Acceptance Criteria:
-- [ ] Migration applies cleanly without errors
-- [ ] Public SELECT on grants returns only approved grants
-- [ ] Non-admin UPDATE on grants moderation_status raises exception 42501
-- [ ] Non-admin UPDATE on organisations verification_status raises exception 42501
-- [ ] Owners can SELECT their own grants regardless of moderation_status
-- [ ] Admins can SELECT and UPDATE all grants/organisations
