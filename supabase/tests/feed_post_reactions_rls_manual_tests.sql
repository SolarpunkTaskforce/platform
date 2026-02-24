-- Manual SQL tests for feed_post_reactions RLS policies
-- These tests should be run manually in a Supabase SQL editor or psql session
-- to verify that the RLS policies are working correctly.
--
-- Prerequisites:
-- 1. Run migration 20260323130002_add_feed_post_reactions.sql
-- 2. Have at least two test user accounts (for testing cross-user scenarios)
-- 3. Have at least one public feed post created
--
-- Test Setup (run as admin or with RLS disabled):
-- SET LOCAL ROLE postgres;
-- SET LOCAL auth.uid TO NULL;

-- ===================================================================
-- TEST 1: Anonymous users can read reactions on public posts
-- ===================================================================
-- Expected: SELECT succeeds and returns reactions
SET LOCAL auth.uid TO NULL;

SELECT * FROM public.feed_post_reactions
WHERE post_id IN (
  SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1
);
-- Expected: Returns reactions if any exist, or empty result (no error)

-- ===================================================================
-- TEST 2: Anonymous users CANNOT insert reactions
-- ===================================================================
-- Expected: INSERT fails with insufficient privilege error
SET LOCAL auth.uid TO NULL;

-- INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
-- VALUES (
--   (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1),
--   'some-uuid-here',
--   'like'
-- );
-- Expected error: permission denied for table feed_post_reactions

-- ===================================================================
-- TEST 3: Authenticated user can insert their own reaction
-- ===================================================================
-- Expected: INSERT succeeds
SET LOCAL auth.uid TO '<test-user-uuid>';

INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
VALUES (
  (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1),
  '<test-user-uuid>',
  'like'
);
-- Expected: INSERT successful

-- ===================================================================
-- TEST 4: Authenticated user CANNOT insert reaction as someone else
-- ===================================================================
-- Expected: INSERT fails with RLS violation
SET LOCAL auth.uid TO '<test-user-uuid>';

-- INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
-- VALUES (
--   (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1),
--   '<different-user-uuid>',
--   'like'
-- );
-- Expected error: new row violates row-level security policy

-- ===================================================================
-- TEST 5: Authenticated user can read their own reactions
-- ===================================================================
-- Expected: SELECT succeeds
SET LOCAL auth.uid TO '<test-user-uuid>';

SELECT * FROM public.feed_post_reactions
WHERE user_id = '<test-user-uuid>';
-- Expected: Returns the user's reactions

-- ===================================================================
-- TEST 6: Authenticated user can delete their own reaction
-- ===================================================================
-- Expected: DELETE succeeds
SET LOCAL auth.uid TO '<test-user-uuid>';

DELETE FROM public.feed_post_reactions
WHERE user_id = '<test-user-uuid>'
  AND post_id = (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1)
  AND reaction_type = 'like';
-- Expected: DELETE successful (1 row deleted if it exists)

-- ===================================================================
-- TEST 7: Authenticated user CANNOT delete someone else's reaction
-- ===================================================================
-- Expected: DELETE fails (0 rows deleted due to RLS)
-- Prerequisite: Another user has created a reaction
SET LOCAL auth.uid TO '<test-user-uuid>';

-- DELETE FROM public.feed_post_reactions
-- WHERE user_id = '<different-user-uuid>'
--   AND post_id = (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1);
-- Expected: DELETE successful but 0 rows affected (RLS blocks access)

-- ===================================================================
-- TEST 8: Unique constraint prevents duplicate reactions
-- ===================================================================
-- Expected: Second INSERT fails with unique constraint violation
SET LOCAL auth.uid TO '<test-user-uuid>';

INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
VALUES (
  (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1),
  '<test-user-uuid>',
  'like'
);
-- Expected: INSERT successful (first time)

-- INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
-- VALUES (
--   (SELECT id FROM public.feed_posts WHERE visibility = 'public' LIMIT 1),
--   '<test-user-uuid>',
--   'like'
-- );
-- Expected error: duplicate key value violates unique constraint "feed_post_reactions_unique"

-- ===================================================================
-- TEST 9: Cascade delete - deleting a post deletes its reactions
-- ===================================================================
-- Expected: Reactions are automatically deleted when post is deleted
-- Prerequisite: Create a test post and add a reaction to it
SET LOCAL ROLE postgres;
SET LOCAL auth.uid TO NULL;

-- Create a test post
INSERT INTO public.feed_posts (created_by, content, visibility)
VALUES (
  '<test-user-uuid>',
  'Test post for cascade delete',
  'public'
)
RETURNING id;
-- Save the returned ID as <test-post-id>

-- Add a reaction to the test post
SET LOCAL auth.uid TO '<test-user-uuid>';
INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
VALUES ('<test-post-id>', '<test-user-uuid>', 'like');

-- Verify the reaction exists
SELECT COUNT(*) FROM public.feed_post_reactions WHERE post_id = '<test-post-id>';
-- Expected: 1

-- Delete the post
SET LOCAL auth.uid TO '<test-user-uuid>';
DELETE FROM public.feed_posts WHERE id = '<test-post-id>';

-- Verify the reaction was cascaded
SET LOCAL ROLE postgres;
SELECT COUNT(*) FROM public.feed_post_reactions WHERE post_id = '<test-post-id>';
-- Expected: 0 (reaction was automatically deleted)

-- ===================================================================
-- TEST 10: Cannot read reactions for non-public posts
-- ===================================================================
-- Expected: SELECT returns empty result even if reactions exist
-- Note: This test would work if we had non-public posts in the future
-- For now, all posts are public per the MVP constraints

-- When visibility other than 'public' is supported:
-- SET LOCAL auth.uid TO '<test-user-uuid>';
-- SELECT * FROM public.feed_post_reactions
-- WHERE post_id IN (
--   SELECT id FROM public.feed_posts WHERE visibility = 'private'
-- );
-- Expected: Empty result (RLS blocks access to reactions on non-public posts)

-- ===================================================================
-- CLEANUP
-- ===================================================================
-- Reset to default role
RESET ROLE;
RESET auth.uid;
