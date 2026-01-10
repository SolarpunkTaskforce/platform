-- Phase 1 / Migration 2: Organisation verification + RLS

-- 1) Add verification fields
alter table public.organisations
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verified_at timestamptz null,
  add column if not exists verified_by uuid null references auth.users(id),
  add column if not exists created_by uuid null references auth.users(id);

-- Ensure allowed values (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organisations_verification_status_check'
  ) then
    alter table public.organisations
      add constraint organisations_verification_status_check
      check (verification_status in ('pending','verified','rejected'));
  end if;
end $$;

-- 2) Best-effort backfill for created_by if your table already has a creator column.
-- If your organisations table has a different creator field, update this block accordingly.
-- This block does nothing if the referenced column doesn't exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organisations'
      and column_name = 'owner_id'
  ) then
    execute 'update public.organisations set created_by = owner_id where created_by is null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organisations'
      and column_name = 'created_by_user_id'
  ) then
    execute 'update public.organisations set created_by = created_by_user_id where created_by is null';
  end if;
end $$;

-- IMPORTANT:
-- We intentionally do NOT force created_by to NOT NULL yet, because existing org rows
-- may not have a known creator. We'll enforce NOT NULL later once we standardize creation.

-- 3) Enable RLS
alter table public.organisations enable row level security;

-- 4) Policies
-- Drop prior policies if any (idempotent-ish; ignore if not present)
do $$
begin
  -- select policies
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Public can read verified organisations') then
    execute 'drop policy "Public can read verified organisations" on public.organisations';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Creators can read their organisations') then
    execute 'drop policy "Creators can read their organisations" on public.organisations';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Admins can read all organisations') then
    execute 'drop policy "Admins can read all organisations" on public.organisations';
  end if;

  -- insert/update/delete policies
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Authenticated can create organisations as pending') then
    execute 'drop policy "Authenticated can create organisations as pending" on public.organisations';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Creators can update pending organisations (non-verification fields)') then
    execute 'drop policy "Creators can update pending organisations (non-verification fields)" on public.organisations';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Admins can update organisations') then
    execute 'drop policy "Admins can update organisations" on public.organisations';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='Admins can delete organisations') then
    execute 'drop policy "Admins can delete organisations" on public.organisations';
  end if;
end $$;

-- SELECT: public sees verified
create policy "Public can read verified organisations"
on public.organisations
for select
using (verification_status = 'verified');

-- SELECT: creator sees own (covers pending/rejected too)
create policy "Creators can read their organisations"
on public.organisations
for select
to authenticated
using (created_by = auth.uid());

-- SELECT: admins see all
create policy "Admins can read all organisations"
on public.organisations
for select
to authenticated
using (public.is_admin());

-- INSERT: authenticated can create pending orgs, must set created_by = auth.uid()
create policy "Authenticated can create organisations as pending"
on public.organisations
for insert
to authenticated
with check (
  verification_status = 'pending'
  and created_by = auth.uid()
);

-- UPDATE: creator can update only while pending AND cannot touch verification fields
create policy "Creators can update pending organisations (non-verification fields)"
on public.organisations
for update
to authenticated
using (
  created_by = auth.uid()
  and verification_status = 'pending'
)
with check (
  created_by = auth.uid()
  and verification_status = 'pending'
  and verified_at is null
  and verified_by is null
  and verification_status = 'pending'
);

-- UPDATE: admins can update anything
create policy "Admins can update organisations"
on public.organisations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- DELETE: admin only (optional but safe)
create policy "Admins can delete organisations"
on public.organisations
for delete
to authenticated
using (public.is_admin());

-- 5) Verified organisations view for dropdowns
create or replace view public.verified_organisations as
select id, name
from public.organisations
where verification_status = 'verified';

-- Ensure anon + authenticated can select from the view
grant select on public.verified_organisations to anon, authenticated;
