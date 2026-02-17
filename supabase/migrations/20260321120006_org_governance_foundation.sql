-- Migration: org_governance_foundation
-- Created: 2026-02-17T23:27:53.047Z
--
-- Implement governance foundations for LinkedIn-style organisations with SolTas verification.
-- 1) Create organisation_member_requests table
-- 2) Create organisation_verification_submissions table
-- 3) Extend organisation_members with new permission flags
-- 4) Backfill owner→admin and set permission flags
-- 5) Remove "owner" role (only admin and member allowed)
-- 6) Add trigger to prevent orphaned orgs (no org can have zero admins)

begin;

-- ============================================================
-- 1) Create public.organisation_member_requests
-- ============================================================
create table if not exists public.organisation_member_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  message text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  admin_notes text null,
  constraint organisation_member_requests_unique unique (organisation_id, user_id)
);

-- Add CHECK constraint for status
alter table public.organisation_member_requests
  add constraint organisation_member_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Add indexes for efficient queries
create index if not exists organisation_member_requests_org_idx
  on public.organisation_member_requests (organisation_id);

create index if not exists organisation_member_requests_user_idx
  on public.organisation_member_requests (user_id);

create index if not exists organisation_member_requests_status_idx
  on public.organisation_member_requests (status);

-- Enable RLS (policies can be added later)
alter table public.organisation_member_requests enable row level security;

-- ============================================================
-- 2) Create public.organisation_verification_submissions
-- ============================================================
create table if not exists public.organisation_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  admin_notes text null
);

-- Add CHECK constraint for status
alter table public.organisation_verification_submissions
  add constraint organisation_verification_submissions_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Add indexes for efficient queries
create index if not exists organisation_verification_submissions_org_idx
  on public.organisation_verification_submissions (organisation_id);

create index if not exists organisation_verification_submissions_status_idx
  on public.organisation_verification_submissions (status);

-- Enable RLS (policies can be added later)
alter table public.organisation_verification_submissions enable row level security;

-- ============================================================
-- 3) Extend organisation_members with new permission flags
-- ============================================================
alter table public.organisation_members
  add column if not exists can_create_issues boolean not null default false,
  add column if not exists can_post_feed boolean not null default false,
  add column if not exists can_manage_members boolean not null default false;

-- ============================================================
-- 4) Backfill: owner → admin and set permission flags for admins
-- ============================================================

-- 4a) Convert all 'owner' roles to 'admin'
update public.organisation_members
set role = 'admin'
where role = 'owner';

-- 4b) Set all permission flags to true for admin role
--     (including existing can_create_projects and can_create_funding)
update public.organisation_members
set
  can_create_projects = true,
  can_create_funding = true,
  can_create_issues = true,
  can_post_feed = true,
  can_manage_members = true
where role = 'admin';

-- ============================================================
-- 5) Remove "owner" role: Add CHECK constraint for role values
-- ============================================================

-- Drop old constraint if it exists
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'organisation_members_role_check'
  ) then
    alter table public.organisation_members
      drop constraint organisation_members_role_check;
  end if;
end $$;

-- Add new constraint allowing only 'admin' and 'member'
alter table public.organisation_members
  add constraint organisation_members_role_check
  check (role in ('admin', 'member'));

-- ============================================================
-- 6) Trigger to prevent orphaned orgs (no org can have zero admins)
-- ============================================================

-- Function to enforce at least one admin per organisation
create or replace function public.enforce_at_least_one_admin()
returns trigger
language plpgsql
security definer
as $$
declare
  admin_count int;
begin
  -- For DELETE: check if we're deleting the last admin
  if (tg_op = 'DELETE') then
    -- Only check if the deleted row was an admin
    if old.role = 'admin' then
      -- Count remaining admins for this organisation (excluding the one being deleted)
      select count(*)
        into admin_count
      from public.organisation_members
      where organisation_id = old.organisation_id
        and role = 'admin'
        and (organisation_id, user_id) != (old.organisation_id, old.user_id);

      if admin_count = 0 then
        raise exception 'Cannot delete the last admin of organisation %', old.organisation_id;
      end if;
    end if;
    return old;
  end if;

  -- For UPDATE: check if we're demoting the last admin to member
  if (tg_op = 'UPDATE') then
    -- Only check if role changed from admin to non-admin
    if old.role = 'admin' and new.role != 'admin' then
      -- Count remaining admins for this organisation (excluding the one being updated)
      select count(*)
        into admin_count
      from public.organisation_members
      where organisation_id = old.organisation_id
        and role = 'admin'
        and (organisation_id, user_id) != (old.organisation_id, old.user_id);

      if admin_count = 0 then
        raise exception 'Cannot demote the last admin of organisation %', old.organisation_id;
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists
drop trigger if exists enforce_at_least_one_admin_trigger on public.organisation_members;

-- Create trigger
create trigger enforce_at_least_one_admin_trigger
  before delete or update of role on public.organisation_members
  for each row
  execute function public.enforce_at_least_one_admin();

commit;
