-- Migration: add_feed_post_reactions
-- Created: 2026-02-24T10:33:14.972Z
--
-- Phase 2A: Add reactions (likes) for feed posts
--
-- POLICIES EXPLANATION:
-- 1. SELECT: Allow reading reactions only for posts that are visible (visibility='public')
--    This mirrors the feed_posts select policy to prevent reading reactions for non-visible posts
-- 2. INSERT: Authenticated users can only insert reactions with their own user_id
-- 3. DELETE: Authenticated users can only delete their own reactions
--
-- SECURITY:
-- - Users cannot like as someone else (INSERT policy checks user_id = auth.uid())
-- - Deleting a post cascades reactions (on delete cascade on post_id FK)
-- - RLS prevents reading reactions for non-visible posts (SELECT policy checks parent post visibility)

begin;

-- 1) Create feed_post_reactions table
create table public.feed_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now()
);

-- 2) Add unique constraint: one reaction per user per post per reaction type
-- Using (post_id, user_id, reaction_type) allows for future emoji variations
-- For MVP with only 'like', effectively one like per user per post
alter table public.feed_post_reactions
  add constraint feed_post_reactions_unique
  unique (post_id, user_id, reaction_type);

-- 3) Add indexes for performance
-- Index on post_id for querying reactions per post
create index feed_post_reactions_post_id_idx
  on public.feed_post_reactions (post_id);

-- Index on user_id for querying user's reactions
create index feed_post_reactions_user_id_idx
  on public.feed_post_reactions (user_id);

-- 4) Enable RLS
alter table public.feed_post_reactions enable row level security;

-- 5) SELECT policy: allow reading reactions only if the parent post is readable
-- This mirrors the feed_posts visibility rules (visibility='public')
drop policy if exists "feed_post_reactions_select_public" on public.feed_post_reactions;
create policy "feed_post_reactions_select_public"
  on public.feed_post_reactions
  for select
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_reactions.post_id
        and fp.visibility = 'public'
    )
  );

-- 6) INSERT policy: authenticated users can only insert their own reactions
drop policy if exists "feed_post_reactions_insert_self" on public.feed_post_reactions;
create policy "feed_post_reactions_insert_self"
  on public.feed_post_reactions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- 7) DELETE policy: authenticated users can only delete their own reactions
drop policy if exists "feed_post_reactions_delete_self" on public.feed_post_reactions;
create policy "feed_post_reactions_delete_self"
  on public.feed_post_reactions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- 8) Grant permissions
-- Authenticated users can select, insert, and delete
grant select, insert, delete on public.feed_post_reactions to authenticated;

-- Anonymous users can only select (read) reactions
grant select on public.feed_post_reactions to anon;

commit;
