-- Migration: update_reactions_comments_rls
-- Created: 2026-02-24
--
-- Updates RLS policies for feed_post_reactions and feed_post_comments to respect
-- the new visibility levels (public and followers) instead of just checking 'public'.
--
-- The new policies delegate to feed_posts RLS by checking if the parent post is readable.

begin;

-- 1) Update feed_post_reactions SELECT policy
-- Instead of checking visibility='public', we check if the post is readable
-- by using the feed_posts RLS policy
drop policy if exists "feed_post_reactions_select_public" on public.feed_post_reactions;
create policy "feed_post_reactions_select_readable"
  on public.feed_post_reactions
  for select
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_reactions.post_id
      -- The feed_posts RLS policy will automatically filter based on visibility
      -- This ensures reactions are only visible if the parent post is visible
    )
  );

-- 2) Update feed_post_comments SELECT policy
drop policy if exists "feed_post_comments_select_public" on public.feed_post_comments;
create policy "feed_post_comments_select_readable"
  on public.feed_post_comments
  for select
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_comments.post_id
      -- The feed_posts RLS policy will automatically filter based on visibility
    )
  );

commit;
