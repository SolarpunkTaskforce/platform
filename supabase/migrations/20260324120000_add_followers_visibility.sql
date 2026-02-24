-- Migration: add_followers_visibility
-- Created: 2026-02-24
--
-- Adds 'followers' visibility level to feed_posts table and updates RLS policies
-- to enforce that:
-- - public: anyone can see
-- - followers: only authenticated users who follow the author identity (user/org) can see
--
-- CHANGES:
-- 1. Drop the old visibility check constraint
-- 2. Add new visibility check allowing 'public' and 'followers'
-- 3. Update SELECT policy to include followers logic

begin;

-- 1) Drop old visibility constraint
alter table public.feed_posts
  drop constraint if exists feed_posts_visibility_check;

-- 2) Add new visibility check allowing 'public' and 'followers'
alter table public.feed_posts
  add constraint feed_posts_visibility_check
  check (visibility in ('public', 'followers'));

-- 3) Drop old SELECT policy
drop policy if exists "feed_posts_select_public" on public.feed_posts;

-- 4) Create new SELECT policy that includes followers logic
-- Policy: users can see posts if:
--   a) visibility = 'public', OR
--   b) visibility = 'followers' AND (
--      - user is the author, OR
--      - authenticated user follows the author (user or org)
--   )
create policy "feed_posts_select_visibility"
  on public.feed_posts
  for select
  using (
    visibility = 'public'
    or (
      visibility = 'followers'
      and auth.uid() is not null
      and (
        -- Author can see their own posts
        created_by = auth.uid()
        or
        -- Following the user author
        (
          author_organisation_id is null
          and exists (
            select 1
            from public.follow_edges fe
            where fe.follower_user_id = auth.uid()
              and fe.target_type = 'person'
              and fe.target_person_id = feed_posts.created_by
          )
        )
        or
        -- Following the organisation author
        (
          author_organisation_id is not null
          and exists (
            select 1
            from public.follow_edges fe
            where fe.follower_user_id = auth.uid()
              and fe.target_type = 'org'
              and fe.target_org_id = feed_posts.author_organisation_id
          )
        )
      )
    )
  );

commit;
