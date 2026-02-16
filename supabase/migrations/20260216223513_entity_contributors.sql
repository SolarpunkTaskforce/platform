-- Migration: Add universal attribution/contact-person system
-- Purpose: Create entity_contributors table usable for projects + funding + issues
-- Date: 2026-02-16

-- Create entity_contributors table
create table if not exists public.entity_contributors (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project', 'funding', 'issue')),
  entity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title_label text null,  -- e.g. "Project Lead", "Contact Person"
  is_public boolean not null default true,
  added_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Create indexes for efficient lookups
create index if not exists entity_contributors_entity_idx
  on public.entity_contributors (entity_type, entity_id);

create index if not exists entity_contributors_user_id_idx
  on public.entity_contributors (user_id);

-- Enable Row Level Security
alter table public.entity_contributors enable row level security;

-- RLS Policy: Public can read rows where is_public=true
create policy "entity_contributors_select_public"
  on public.entity_contributors
  for select
  to anon, authenticated
  using (is_public = true);

-- RLS Policy: Authenticated users can read all their own contributions
create policy "entity_contributors_select_own"
  on public.entity_contributors
  for select
  to authenticated
  using (user_id = auth.uid() or added_by = auth.uid());

-- RLS Policy: Authenticated users can insert
-- NOTE: This is a baseline policy. Should be constrained by entity ownership rules
-- in a future migration once ownership checks are implemented
create policy "entity_contributors_insert_authenticated"
  on public.entity_contributors
  for insert
  to authenticated
  with check (
    -- User must be authenticated
    auth.uid() is not null
    -- TODO: Add entity ownership checks:
    -- - For entity_type='project': check project ownership or collaboration rights
    -- - For entity_type='funding': check funding ownership rights
    -- - For entity_type='issue': check issue ownership rights
  );

-- RLS Policy: Users can update their own contributions or contributions they added
create policy "entity_contributors_update_own"
  on public.entity_contributors
  for update
  to authenticated
  using (user_id = auth.uid() or added_by = auth.uid())
  with check (user_id = auth.uid() or added_by = auth.uid());

-- RLS Policy: Users can delete contributions they added
create policy "entity_contributors_delete_own"
  on public.entity_contributors
  for delete
  to authenticated
  using (added_by = auth.uid());

-- Grant permissions
grant select on public.entity_contributors to anon, authenticated;
grant insert, update, delete on public.entity_contributors to authenticated;
