-- Manual SQL tests for notifications triggers on reactions and comments
-- These tests should be run manually in a Supabase SQL editor or psql session
-- to verify that the notification triggers are working correctly.
--
-- Prerequisites:
-- 1. Run migration 20260324120003_notifications_for_reactions_comments.sql
-- 2. Have at least two test user accounts (author and commenter/reactor)
-- 3. Have at least one public feed post created by test user
--
-- Test Setup (run as admin or with RLS disabled):
-- SET LOCAL ROLE postgres;
-- SET LOCAL auth.uid TO NULL;

-- ===================================================================
-- SETUP: Create test users and data
-- ===================================================================
-- Replace these UUIDs with actual test user UUIDs
-- <author-user-uuid> = UUID of the post author
-- <other-user-uuid> = UUID of another user who will react/comment

-- ===================================================================
-- TEST 1: Notification created when user comments on another's post
-- ===================================================================
-- Expected: New notification is inserted for post author

-- First, create a test post as the author
SET LOCAL auth.uid TO '<author-user-uuid>';

INSERT INTO public.feed_posts (created_by, content, visibility)
VALUES ('<author-user-uuid>', 'Test post for notification triggers', 'public')
RETURNING id;
-- Save the returned ID as <test-post-id>

-- Check initial notification count for author
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_comment';
-- Expected: 0 (or current count)

-- Now, another user comments on the post
SET LOCAL auth.uid TO '<other-user-uuid>';

INSERT INTO public.feed_post_comments (post_id, created_by, content)
VALUES ('<test-post-id>', '<other-user-uuid>', 'Great post!');

-- Check notification was created for author
SET LOCAL auth.uid TO '<author-user-uuid>';

SELECT * FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_comment'
  AND metadata->>'post_id' = '<test-post-id>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: 1 notification with title like "Someone commented on your post"
--           body should contain post preview
--           href should be '/feed?post=<test-post-id>'

-- ===================================================================
-- TEST 2: No notification when author comments on their own post
-- ===================================================================
-- Expected: No new notification is created

-- Count notifications before
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_comment';
-- Note the count

-- Author comments on their own post
INSERT INTO public.feed_post_comments (post_id, created_by, content)
VALUES ('<test-post-id>', '<author-user-uuid>', 'Thanks everyone!');

-- Check notification count (should be unchanged)
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_comment';
-- Expected: Same count as before (no new notification)

-- ===================================================================
-- TEST 3: Notification created when user reacts to another's post
-- ===================================================================
-- Expected: New notification is inserted for post author

-- Check initial notification count for author
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_reaction';
-- Expected: 0 (or current count)

-- Another user reacts to the post
SET LOCAL auth.uid TO '<other-user-uuid>';

INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
VALUES ('<test-post-id>', '<other-user-uuid>', 'like');

-- Check notification was created for author
SET LOCAL auth.uid TO '<author-user-uuid>';

SELECT * FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_reaction'
  AND metadata->>'post_id' = '<test-post-id>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: 1 notification with title like "Someone liked your post"
--           body should contain post preview
--           href should be '/feed?post=<test-post-id>'

-- ===================================================================
-- TEST 4: No notification when author reacts to their own post
-- ===================================================================
-- Expected: No new notification is created

-- Count notifications before
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_reaction';
-- Note the count

-- Author reacts to their own post
INSERT INTO public.feed_post_reactions (post_id, user_id, reaction_type)
VALUES ('<test-post-id>', '<author-user-uuid>', 'like');

-- Check notification count (should be unchanged)
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>' AND type = 'feed_post_reaction';
-- Expected: Same count as before (no new notification)

-- ===================================================================
-- TEST 5: Verify RLS - user cannot read others' notifications
-- ===================================================================
-- Expected: User can only see their own notifications

SET LOCAL auth.uid TO '<other-user-uuid>';

-- Try to read author's notifications
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>';
-- Expected: 0 (RLS blocks access to other users' notifications)

-- Can read own notifications
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<other-user-uuid>';
-- Expected: Actual count of other-user's notifications

-- ===================================================================
-- TEST 6: Verify notification cannot be created from client
-- ===================================================================
-- Expected: Direct INSERT fails with permission error

SET LOCAL auth.uid TO '<other-user-uuid>';

-- Try to forge a notification as authenticated user
-- INSERT INTO public.notifications (user_id, type, title, body, href)
-- VALUES ('<author-user-uuid>', 'fake_notification', 'Fake Title', 'Fake Body', '/fake');
-- Expected error: permission denied for table notifications
-- Note: This test is commented out because INSERT is not granted to authenticated users

-- Verify that authenticated users don't have INSERT grant
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'notifications'
  AND grantee = 'authenticated';
-- Expected: Only SELECT and UPDATE privileges, no INSERT

-- ===================================================================
-- TEST 7: Notification includes correct metadata
-- ===================================================================
-- Expected: Metadata contains all expected fields

SET LOCAL auth.uid TO '<author-user-uuid>';

-- Check comment notification metadata
SELECT
  metadata->>'post_id' as post_id,
  metadata->>'comment_id' as comment_id,
  metadata->>'commenter_id' as commenter_id,
  metadata->>'commenter_org_id' as commenter_org_id
FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_comment'
  AND metadata->>'post_id' = '<test-post-id>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: All fields populated correctly (org_id may be null)

-- Check reaction notification metadata
SELECT
  metadata->>'post_id' as post_id,
  metadata->>'reaction_id' as reaction_id,
  metadata->>'reactor_id' as reactor_id,
  metadata->>'reaction_type' as reaction_type
FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_reaction'
  AND metadata->>'post_id' = '<test-post-id>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: All fields populated correctly with reaction_type = 'like'

-- ===================================================================
-- TEST 8: Organisation comment creates notification with org name
-- ===================================================================
-- Expected: Notification title includes organisation name
-- Prerequisite: User must be owner/admin of an organisation

-- Create test org (run as postgres if needed)
SET LOCAL ROLE postgres;
SET LOCAL auth.uid TO NULL;

INSERT INTO public.organisations (name)
VALUES ('Test Organisation')
RETURNING id;
-- Save the returned ID as <test-org-id>

-- Make other-user an admin of the org
INSERT INTO public.organisation_members (organisation_id, user_id, role)
VALUES ('<test-org-id>', '<other-user-uuid>', 'admin');

-- Other user comments as the organisation
SET LOCAL auth.uid TO '<other-user-uuid>';

INSERT INTO public.feed_post_comments (post_id, created_by, author_organisation_id, content)
VALUES ('<test-post-id>', '<other-user-uuid>', '<test-org-id>', 'Comment as org');

-- Check notification includes org name
SET LOCAL auth.uid TO '<author-user-uuid>';

SELECT title FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_comment'
  AND metadata->>'commenter_org_id' = '<test-org-id>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: Title like "Test Organisation commented on your post"

-- ===================================================================
-- TEST 9: Cascade delete - deleting comment/reaction doesn't delete notification
-- ===================================================================
-- Expected: Notifications persist even after comments/reactions are deleted

-- Count notifications before deletion
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_comment';
-- Note the count

-- Delete a comment
SET LOCAL auth.uid TO '<other-user-uuid>';
DELETE FROM public.feed_post_comments
WHERE post_id = '<test-post-id>'
  AND created_by = '<other-user-uuid>'
  AND content = 'Great post!';

-- Verify notification still exists
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND type = 'feed_post_comment';
-- Expected: Same count as before (notifications are preserved)

-- ===================================================================
-- TEST 10: Cascade delete - deleting post cascades to notifications
-- ===================================================================
-- Expected: Notifications reference post_id in metadata but don't cascade delete
-- Note: There's no FK from notifications to feed_posts, so notifications persist

-- Check notification exists
SET LOCAL auth.uid TO '<author-user-uuid>';
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND metadata->>'post_id' = '<test-post-id>';
-- Note the count

-- Delete the post
DELETE FROM public.feed_posts WHERE id = '<test-post-id>';

-- Verify notifications still exist (no cascade)
SELECT COUNT(*) FROM public.notifications
WHERE user_id = '<author-user-uuid>'
  AND metadata->>'post_id' = '<test-post-id>';
-- Expected: Same count (notifications persist after post deletion)
-- Note: This is intentional - users should see notification history

-- ===================================================================
-- CLEANUP
-- ===================================================================
-- Clean up test data
SET LOCAL ROLE postgres;

-- Delete test notifications
DELETE FROM public.notifications
WHERE metadata->>'post_id' = '<test-post-id>';

-- Delete test posts
DELETE FROM public.feed_posts WHERE id = '<test-post-id>';

-- Delete test org membership
DELETE FROM public.organisation_members WHERE organisation_id = '<test-org-id>';

-- Delete test org
DELETE FROM public.organisations WHERE id = '<test-org-id>';

-- Reset to default role
RESET ROLE;
RESET auth.uid;
