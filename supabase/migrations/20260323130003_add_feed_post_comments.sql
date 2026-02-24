-- Migration: add_feed_post_comments
-- Created: 2026-02-24T10:53:46.216Z
--
-- Phase 3A: Add comments for feed posts with dual identity authoring (user or organisation)
--
-- POLICIES EXPLANATION:
-- 1. SELECT: Allow reading comments only if the parent post is readable (visibility='public')
--    This mirrors the feed_posts select policy to prevent reading comments for non-visible posts
-- 2. INSERT: Authenticated users can insert if created_by = auth.uid()
--    - If author_organisation_id is null: user commenting as themselves
--    - If author_organisation_id is not null: must be owner/admin of that org
-- 3. UPDATE: Allow if created_by = auth.uid() (comment author), OR
--    - If comment was authored as org: current user is owner/admin of that org
-- 4. DELETE: Same as UPDATE
--
-- SECURITY:
-- - Users cannot comment as someone else (INSERT policy checks created_by = auth.uid())
-- - Deleting a post cascades comments (on delete cascade on post_id FK)
-- - RLS prevents reading comments for non-visible posts (SELECT policy checks parent post visibility)
-- - Org admins/owners can manage comments made as their org

begin;

-- 1) Create feed_post_comments table
create table public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  author_organisation_id uuid null references public.organisations(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add indexes for performance
-- Index on (post_id, created_at) for querying comments per post ordered by time
create index feed_post_comments_post_id_created_at_idx
  on public.feed_post_comments (post_id, created_at);

-- Index on created_by for querying user's comments
create index feed_post_comments_created_by_idx
  on public.feed_post_comments (created_by);

-- Index on author_organisation_id for querying org comments
create index feed_post_comments_author_organisation_id_idx
  on public.feed_post_comments (author_organisation_id)
  where author_organisation_id is not null;

-- 3) Add updated_at trigger using existing set_updated_at function
drop trigger if exists feed_post_comments_set_updated_at on public.feed_post_comments;
create trigger feed_post_comments_set_updated_at
  before update on public.feed_post_comments
  for each row
  execute function public.set_updated_at();

-- 4) Enable RLS
alter table public.feed_post_comments enable row level security;

-- 5) SELECT policy: allow reading comments only if the parent post is readable
-- This mirrors the feed_posts visibility rules (visibility='public')
drop policy if exists "feed_post_comments_select_public" on public.feed_post_comments;
create policy "feed_post_comments_select_public"
  on public.feed_post_comments
  for select
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_comments.post_id
        and fp.visibility = 'public'
    )
  );

-- 6) INSERT policy: authenticated users can insert if created_by = auth.uid()
--    and if author_organisation_id is not null, must be owner/admin of that org
drop policy if exists "feed_post_comments_insert_auth" on public.feed_post_comments;
create policy "feed_post_comments_insert_auth"
  on public.feed_post_comments
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      author_organisation_id is null
      or exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_post_comments.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

-- 7) UPDATE policy: allow if created_by = auth.uid() (comment author), OR
--    if comment was authored as org: current user is owner/admin of that org
drop policy if exists "feed_post_comments_update_auth" on public.feed_post_comments;
create policy "feed_post_comments_update_auth"
  on public.feed_post_comments
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or (
      author_organisation_id is not null
      and exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_post_comments.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  )
  with check (
    created_by = auth.uid()
    or (
      author_organisation_id is not null
      and exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_post_comments.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

-- 8) DELETE policy: same as UPDATE
drop policy if exists "feed_post_comments_delete_auth" on public.feed_post_comments;
create policy "feed_post_comments_delete_auth"
  on public.feed_post_comments
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or (
      author_organisation_id is not null
      and exists (
        select 1
        from public.organisation_members om
        where om.organisation_id = feed_post_comments.author_organisation_id
          and om.user_id = auth.uid()
          and om.role in ('owner', 'admin')
      )
    )
  );

-- 9) Grant permissions
-- Authenticated users can select, insert, update, and delete
grant select, insert, update, delete on public.feed_post_comments to authenticated;

-- Anonymous users can only select (read) comments
grant select on public.feed_post_comments to anon;

commit;
