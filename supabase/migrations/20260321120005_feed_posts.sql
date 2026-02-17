-- Migration: feed_posts
-- Created: 2026-02-17T22:07:00.714Z
--
-- MVP feed backend for public.feed_posts with dual identity authoring (user or organisation)
-- and optional entity reference (project, funding, issue).
--
-- POLICIES EXPLANATION:
-- 1. SELECT: Anyone can read posts where visibility='public'
-- 2. INSERT: Authenticated users can insert if created_by = auth.uid()
--    - If author_organisation_id is null: ok
--    - If author_organisation_id is not null: must be owner/admin of that org
-- 3. UPDATE/DELETE: Allow if created_by = auth.uid() and either:
--    - author_organisation_id is null, OR
--    - user has owner/admin role for that org

begin;

-- 1) Create feed_posts table with all required columns
create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  author_organisation_id uuid null references public.organisations(id) on delete set null,
  visibility text not null default 'public',
  content text not null,
  entity_type text null,
  entity_id uuid null,
  published_at timestamptz not null default now()
);

-- 2) Add constraints
-- Visibility check: only 'public' allowed for MVP
alter table public.feed_posts
  add constraint feed_posts_visibility_check
  check (visibility in ('public'));

-- Entity type check: only allowed values when not null
alter table public.feed_posts
  add constraint feed_posts_entity_type_check
  check (entity_type is null or entity_type in ('project', 'funding', 'issue'));

-- Entity consistency: if entity_type is not null then entity_id must be not null, and vice versa
alter table public.feed_posts
  add constraint feed_posts_entity_consistency_check
  check (
    (entity_type is null and entity_id is null) or
    (entity_type is not null and entity_id is not null)
  );

-- 3) Add indexes for performance
-- Index on published_at desc for feed queries (most recent first)
create index feed_posts_published_at_idx
  on public.feed_posts (published_at desc);

-- Index on (entity_type, entity_id) for entity lookups
create index feed_posts_entity_lookup_idx
  on public.feed_posts (entity_type, entity_id)
  where entity_type is not null;

-- 4) Enable RLS
alter table public.feed_posts enable row level security;

-- 5) SELECT policy: anyone can read public posts
drop policy if exists "feed_posts_select_public" on public.feed_posts;
create policy "feed_posts_select_public"
  on public.feed_posts
  for select
  using (visibility = 'public');

-- 6) INSERT policy: authenticated users can insert if created_by = auth.uid()
--    and if author_organisation_id is not null, must be owner/admin of that org
drop policy if exists "feed_posts_insert_auth" on public.feed_posts;
create policy "feed_posts_insert_auth"
  on public.feed_posts
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      author_organisation_id is null
      or exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_posts.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

-- 7) UPDATE policy: allow if created_by = auth.uid() and either:
--    - author_organisation_id is null, OR
--    - user has owner/admin role for that org
drop policy if exists "feed_posts_update_auth" on public.feed_posts;
create policy "feed_posts_update_auth"
  on public.feed_posts
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and (
      author_organisation_id is null
      or exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_posts.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  )
  with check (
    created_by = auth.uid()
    and (
      author_organisation_id is null
      or exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_posts.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

-- 8) DELETE policy: same as UPDATE
drop policy if exists "feed_posts_delete_auth" on public.feed_posts;
create policy "feed_posts_delete_auth"
  on public.feed_posts
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    and (
      author_organisation_id is null
      or exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_posts.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

commit;
