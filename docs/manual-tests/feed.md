# Feed Posting Manual Tests

This document provides comprehensive manual testing procedures for feed posting functionality, including individual and organisation posting, entity integration, and access control.

## Prerequisites

1. Application running locally or on staging environment
2. Clean database state or ability to create new test accounts
3. At least one verified organisation in the database
4. Multiple browser windows/incognito tabs for testing different user states
5. Test data: projects, funding opportunities, and watchdog issues

## Test Accounts Needed

- **Unauthenticated visitor**: Logged out browser session
- **Individual user**: User account with no organisation memberships
- **Organisation member**: User with member role in an organisation (not admin/owner)
- **Organisation admin**: User with admin role in an organisation
- **Organisation owner**: User with owner role in an organisation
- **User A**: For testing post ownership and permissions
- **User B**: Different user for testing cross-user permissions

---

## Test 1: Logged Out User Can View Feed

**Objective**: Verify that unauthenticated users can view the public feed without logging in

**Prerequisites**: At least one public feed post exists in the database

**Steps**:
1. Open an incognito/private browser window
2. Navigate to the feed page (e.g., `/feed`)
3. Observe the feed content displayed
4. Attempt to interact with posts (if UI allows)

**Expected Result**:
- ✓ Feed page loads successfully without authentication
- ✓ Public feed posts are visible
- ✓ Post content, author information, and timestamps are displayed
- ✓ No "Create Post" button or posting interface visible
- ✓ Posts from both individuals and organisations are visible
- ✓ No server errors or redirect to login page

**Database Validation**:
```sql
-- Verify all visible posts have visibility = 'public'
SELECT id, visibility, created_by, author_organisation_id
FROM feed_posts
WHERE visibility = 'public'
ORDER BY published_at DESC;
```

**Security Reminder**:
- Only posts with `visibility = 'public'` should be visible
- No authentication required for viewing

---

## Test 2: Logged In User Can Post as Individual

**Objective**: Verify that authenticated users can create feed posts under their personal account

**Prerequisites**:
- User logged in
- User has no organisation memberships (or can choose individual posting)

**Steps**:
1. Log in as individual user
2. Navigate to the feed page or posting interface
3. Create a new feed post with text content (e.g., "Test post from individual user")
4. Submit the post
5. Verify the post appears in the feed

**Expected Result**:
- ✓ "Create Post" or similar button is visible for authenticated users
- ✓ Posting interface allows entering text content
- ✓ Post is successfully created
- ✓ Post appears in the feed immediately or after refresh
- ✓ Post shows user's name/profile as the author
- ✓ Post does NOT show organisation attribution

**Database Validation**:
```sql
-- Verify post was created with correct individual attribution
SELECT id, created_by, author_organisation_id, content, visibility
FROM feed_posts
WHERE content LIKE '%Test post from individual user%'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: author_organisation_id should be NULL
-- Expected: created_by should match the logged-in user's ID
```

**UI Validation**:
- Post displays user's personal profile/avatar
- No organisation badge or label on the post

---

## Test 3: Organisation Owner Can Post as Organisation

**Objective**: Verify that organisation owners can create feed posts on behalf of their organisation

**Prerequisites**:
- User logged in with owner role in an organisation
- Organisation is verified

**Steps**:
1. Log in as organisation owner
2. Navigate to the feed posting interface
3. Select/toggle option to post as the organisation (if applicable)
4. Create a new feed post with text content (e.g., "Official announcement from [Org Name]")
5. Submit the post
6. Verify the post appears with organisation attribution

**Expected Result**:
- ✓ Option to post as organisation is available (dropdown, toggle, or similar)
- ✓ Post is successfully created
- ✓ Post appears in the feed with organisation attribution
- ✓ Post shows organisation name/logo as the author
- ✓ Post displays organisation branding/badge

**Database Validation**:
```sql
-- Verify post was created with organisation attribution
SELECT fp.id, fp.created_by, fp.author_organisation_id, fp.content, o.name as org_name
FROM feed_posts fp
LEFT JOIN organisations o ON fp.author_organisation_id = o.id
WHERE fp.content LIKE '%Official announcement%'
ORDER BY fp.created_at DESC
LIMIT 1;

-- Expected: author_organisation_id should match the organisation ID
-- Expected: created_by should match the logged-in user's ID

-- Verify user has owner role
SELECT role
FROM organisation_members
WHERE user_id = '[user-id]' AND organisation_id = '[org-id]';

-- Expected: role should be 'owner'
```

---

## Test 4: Organisation Admin Can Post as Organisation

**Objective**: Verify that organisation admins can create feed posts on behalf of their organisation

**Prerequisites**:
- User logged in with admin role in an organisation
- Organisation is verified

**Steps**:
1. Log in as organisation admin (not owner)
2. Navigate to the feed posting interface
3. Select/toggle option to post as the organisation
4. Create a new feed post with text content (e.g., "Update from [Org Name] by admin")
5. Submit the post
6. Verify the post appears with organisation attribution

**Expected Result**:
- ✓ Option to post as organisation is available for admin users
- ✓ Post is successfully created
- ✓ Post appears in the feed with organisation attribution
- ✓ Post shows organisation name/logo as the author
- ✓ Admins have same posting privileges as owners

**Database Validation**:
```sql
-- Verify post was created with organisation attribution
SELECT fp.id, fp.created_by, fp.author_organisation_id, fp.content, o.name as org_name
FROM feed_posts fp
LEFT JOIN organisations o ON fp.author_organisation_id = o.id
WHERE fp.content LIKE '%Update from%by admin%'
ORDER BY fp.created_at DESC
LIMIT 1;

-- Verify user has admin role
SELECT role
FROM organisation_members
WHERE user_id = '[user-id]' AND organisation_id = '[org-id]';

-- Expected: role should be 'admin'
```

---

## Test 5: Organisation Member Cannot Post as Organisation

**Objective**: Verify that regular organisation members (non-admin, non-owner) cannot create posts on behalf of the organisation

**Prerequisites**:
- User logged in with member role in an organisation (not admin or owner)
- Organisation is verified

**Steps**:
1. Log in as organisation member
2. Navigate to the feed posting interface
3. Attempt to select/toggle option to post as the organisation
4. Try to create a post as the organisation

**Expected Result**:
- ✓ Option to post as organisation is NOT available for regular members
- ✓ OR: Option appears but attempting to post returns an error
- ✓ User can only post as individual
- ✓ Error message explains insufficient permissions (if attempted)
- ✓ No post is created in the database with organisation attribution

**Database Validation**:
```sql
-- Verify user has member role (not admin/owner)
SELECT role
FROM organisation_members
WHERE user_id = '[user-id]' AND organisation_id = '[org-id]';

-- Expected: role should be 'member'

-- Verify no posts were created by this user for the organisation
SELECT fp.id, fp.created_by, fp.author_organisation_id
FROM feed_posts fp
WHERE fp.created_by = '[user-id]'
  AND fp.author_organisation_id = '[org-id]'
ORDER BY fp.created_at DESC;

-- Expected: No results (or only posts created before role change)
```

**Security Reminder**:
- RLS policy `feed_posts_insert_auth` should prevent members from posting as organisation
- Backend validation must check `role IN ('owner', 'admin')` for organisation posts

---

## Test 6: Project Creation with "Post to Feed" Checkbox

**Objective**: Verify that creating a project with "Post to Feed" checkbox enabled automatically creates a feed post

**Prerequisites**:
- User logged in with permissions to create projects
- Project creation form accessible

**Steps**:
1. Log in as user with project creation permissions
2. Navigate to the project creation form
3. Fill in required project details (name, description, etc.)
4. Enable/check the "Post to Feed" checkbox
5. Submit the project creation form
6. Navigate to the feed page
7. Verify a feed post about the project appears

**Expected Result**:
- ✓ "Post to Feed" checkbox is visible on project creation form
- ✓ Project is successfully created
- ✓ Feed post is automatically created
- ✓ Feed post includes project information/link
- ✓ Feed post has `entity_type = 'project'` and `entity_id` matching the project
- ✓ If created as organisation, post shows organisation attribution
- ✓ If created as individual, post shows individual attribution

**Database Validation**:
```sql
-- Verify project was created
SELECT id, name, created_by
FROM projects
WHERE name LIKE '%[Test Project Name]%'
ORDER BY created_at DESC
LIMIT 1;

-- Verify feed post was created with project reference
SELECT fp.id, fp.entity_type, fp.entity_id, fp.content, fp.author_organisation_id
FROM feed_posts fp
WHERE fp.entity_type = 'project'
  AND fp.entity_id = '[project-id]'
ORDER BY fp.created_at DESC
LIMIT 1;

-- Expected: entity_type should be 'project'
-- Expected: entity_id should match the project ID
-- Expected: content should reference the project
```

**UI Validation**:
- Feed post displays as a project announcement/card
- Link to project is included in the post

---

## Test 7: Funding Creation with "Post to Feed" Checkbox

**Objective**: Verify that creating a funding opportunity with "Post to Feed" checkbox enabled automatically creates a feed post

**Prerequisites**:
- User logged in with permissions to create funding opportunities
- Funding/grant creation form accessible

**Steps**:
1. Log in as user with funding creation permissions
2. Navigate to the funding/grant creation form
3. Fill in required funding details (name, amount, deadline, etc.)
4. Enable/check the "Post to Feed" checkbox
5. Submit the funding creation form
6. Navigate to the feed page
7. Verify a feed post about the funding opportunity appears

**Expected Result**:
- ✓ "Post to Feed" checkbox is visible on funding creation form
- ✓ Funding opportunity is successfully created
- ✓ Feed post is automatically created
- ✓ Feed post includes funding information/link
- ✓ Feed post has `entity_type = 'funding'` and `entity_id` matching the funding opportunity
- ✓ Post attribution matches the funding creator (individual or organisation)

**Database Validation**:
```sql
-- Verify funding was created (adjust table name based on schema)
SELECT id, title, created_by
FROM grants
WHERE title LIKE '%[Test Funding Name]%'
ORDER BY created_at DESC
LIMIT 1;

-- Verify feed post was created with funding reference
SELECT fp.id, fp.entity_type, fp.entity_id, fp.content, fp.author_organisation_id
FROM feed_posts fp
WHERE fp.entity_type = 'funding'
  AND fp.entity_id = '[funding-id]'
ORDER BY fp.created_at DESC
LIMIT 1;

-- Expected: entity_type should be 'funding'
-- Expected: entity_id should match the funding/grant ID
```

---

## Test 8: Issue Creation with "Post to Feed" Checkbox

**Objective**: Verify that creating a watchdog issue with "Post to Feed" checkbox enabled automatically creates a feed post

**Prerequisites**:
- User logged in with permissions to create watchdog issues
- Issue creation form accessible

**Steps**:
1. Log in as user with issue creation permissions
2. Navigate to the watchdog issue creation form
3. Fill in required issue details (title, description, location, etc.)
4. Enable/check the "Post to Feed" checkbox
5. Submit the issue creation form
6. Navigate to the feed page
7. Verify a feed post about the issue appears

**Expected Result**:
- ✓ "Post to Feed" checkbox is visible on issue creation form
- ✓ Watchdog issue is successfully created
- ✓ Feed post is automatically created
- ✓ Feed post includes issue information/link
- ✓ Feed post has `entity_type = 'issue'` and `entity_id` matching the issue
- ✓ Post attribution matches the issue creator (individual or organisation)

**Database Validation**:
```sql
-- Verify issue was created
SELECT id, title, created_by
FROM watchdog_issues
WHERE title LIKE '%[Test Issue Title]%'
ORDER BY created_at DESC
LIMIT 1;

-- Verify feed post was created with issue reference
SELECT fp.id, fp.entity_type, fp.entity_id, fp.content, fp.author_organisation_id
FROM feed_posts fp
WHERE fp.entity_type = 'issue'
  AND fp.entity_id = '[issue-id]'
ORDER BY fp.created_at DESC
LIMIT 1;

-- Expected: entity_type should be 'issue'
-- Expected: entity_id should match the watchdog issue ID
```

---

## Test 9: User Cannot Edit Another User's Post

**Objective**: Verify that users cannot edit feed posts created by other users

**Prerequisites**:
- User A logged in
- User B logged in (different account)
- Feed post created by User A exists

**Steps**:
1. Log in as User A
2. Create a feed post (e.g., "Post by User A")
3. Note the post ID
4. Log out and log in as User B
5. Attempt to edit User A's post through the UI
6. OR: Attempt to edit via API/direct request (if applicable)

**Expected Result**:
- ✓ Edit button/option is NOT visible for posts by other users
- ✓ OR: Edit button appears but attempting to edit returns permission error
- ✓ Post content remains unchanged
- ✓ Error message indicates insufficient permissions
- ✓ No updates are saved to the database

**Database Validation**:
```sql
-- Verify post ownership
SELECT id, created_by, content
FROM feed_posts
WHERE content LIKE '%Post by User A%'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: created_by should be User A's ID

-- Check that post was not modified by User B
SELECT id, created_by, updated_at
FROM feed_posts
WHERE id = '[post-id]';

-- Expected: updated_at should not change after User B's attempt
```

**Security Reminder**:
- RLS policy `feed_posts_update_auth` should enforce `created_by = auth.uid()`
- Backend must validate post ownership before allowing edits

---

## Test 10: User Cannot Delete Another User's Post

**Objective**: Verify that users cannot delete feed posts created by other users

**Prerequisites**:
- User A logged in
- User B logged in (different account)
- Feed post created by User A exists

**Steps**:
1. Log in as User A
2. Create a feed post (e.g., "Post by User A for deletion test")
3. Note the post ID
4. Log out and log in as User B
5. Attempt to delete User A's post through the UI
6. OR: Attempt to delete via API/direct request (if applicable)

**Expected Result**:
- ✓ Delete button/option is NOT visible for posts by other users
- ✓ OR: Delete button appears but attempting to delete returns permission error
- ✓ Post remains in the feed
- ✓ Post remains in the database
- ✓ Error message indicates insufficient permissions

**Database Validation**:
```sql
-- Verify post still exists after delete attempt
SELECT id, created_by, content
FROM feed_posts
WHERE content LIKE '%Post by User A for deletion test%';

-- Expected: Post should still exist with User A as created_by
```

**Security Reminder**:
- RLS policy `feed_posts_delete_auth` should enforce `created_by = auth.uid()`
- Backend must validate post ownership before allowing deletion

---

## Test 11: User Can Edit Their Own Post

**Objective**: Verify that users can edit their own feed posts

**Prerequisites**:
- User logged in
- User has created at least one feed post

**Steps**:
1. Log in as user
2. Create a new feed post (e.g., "Original content")
3. Locate the edit button/option for the post
4. Edit the post content (e.g., change to "Updated content")
5. Save the changes
6. Verify the updated content appears in the feed

**Expected Result**:
- ✓ Edit button/option is visible for own posts
- ✓ Edit interface loads with current post content
- ✓ Changes can be saved successfully
- ✓ Updated content appears in the feed immediately or after refresh
- ✓ Post ID remains the same
- ✓ `updated_at` timestamp is updated

**Database Validation**:
```sql
-- Verify post was updated
SELECT id, content, updated_at
FROM feed_posts
WHERE id = '[post-id]';

-- Expected: content should show "Updated content"
-- Expected: updated_at should be more recent than created_at
```

---

## Test 12: User Can Delete Their Own Post

**Objective**: Verify that users can delete their own feed posts

**Prerequisites**:
- User logged in
- User has created at least one feed post

**Steps**:
1. Log in as user
2. Create a new feed post (e.g., "Post to be deleted")
3. Note the post ID
4. Locate the delete button/option for the post
5. Confirm deletion (if confirmation dialog appears)
6. Verify the post is removed from the feed

**Expected Result**:
- ✓ Delete button/option is visible for own posts
- ✓ Confirmation dialog appears (recommended UX)
- ✓ Post is successfully deleted
- ✓ Post no longer appears in the feed
- ✓ Post is removed from the database

**Database Validation**:
```sql
-- Verify post was deleted
SELECT id, content
FROM feed_posts
WHERE id = '[post-id]';

-- Expected: No results (post should be deleted)
```

---

## Test 13: Organisation Admin Can Edit Organisation Post

**Objective**: Verify that organisation admins can edit posts created on behalf of the organisation

**Prerequisites**:
- User logged in with admin role in an organisation
- Feed post created by the organisation exists (created by any admin/owner)

**Steps**:
1. Log in as organisation owner
2. Create a feed post as the organisation (e.g., "Org announcement v1")
3. Note the post ID
4. Log out and log in as organisation admin (different user)
5. Locate the edit button for the organisation post
6. Edit the post content (e.g., change to "Org announcement v2")
7. Save the changes

**Expected Result**:
- ✓ Organisation admins can see edit button for organisation posts
- ✓ Changes can be saved successfully
- ✓ Updated content appears in the feed
- ✓ Post attribution remains with the organisation

**Database Validation**:
```sql
-- Verify post was updated
SELECT id, content, author_organisation_id, updated_at
FROM feed_posts
WHERE id = '[post-id]';

-- Verify admin has proper role
SELECT role
FROM organisation_members
WHERE user_id = '[admin-user-id]' AND organisation_id = '[org-id]';

-- Expected: role should be 'admin' or 'owner'
```

**Security Reminder**:
- RLS policy `feed_posts_update_auth` should allow admins/owners of the organisation to edit

---

## Test 14: Public Directory Unaffected by Feed Posts

**Objective**: Verify that the public directory functionality is not affected by feed posting features

**Prerequisites**:
- Public directory page exists (e.g., `/directory`)
- Multiple organisations and projects exist
- Feed posts have been created

**Steps**:
1. Navigate to the public directory page
2. Verify organisations are listed correctly
3. Verify projects are listed correctly
4. Create several feed posts (individual and organisation)
5. Return to the public directory page
6. Verify directory content remains unchanged

**Expected Result**:
- ✓ Public directory displays organisations correctly
- ✓ Public directory displays projects correctly
- ✓ Directory filtering and search work as expected
- ✓ Feed posts do NOT appear in the directory listings
- ✓ Directory content is independent of feed posts
- ✓ No feed post content interferes with directory display

**Database Validation**:
```sql
-- Verify feed_posts table is separate from directory views
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('feed_posts', 'organisations', 'projects');

-- All three tables should exist independently

-- Verify organisations are not affected
SELECT id, name, verified
FROM organisations
ORDER BY name;

-- Expected: All organisations display regardless of feed posts
```

**UI Validation**:
- Directory page layout unchanged
- No feed post elements appear in directory
- Directory search/filters function normally

---

## Test 15: Feed Post with Entity Reference Links to Entity

**Objective**: Verify that feed posts created with entity references (project/funding/issue) include proper links to the referenced entity

**Prerequisites**:
- Project, funding opportunity, or issue exists
- User can create feed posts with entity references

**Steps**:
1. Create a project with "Post to Feed" checkbox enabled
2. Navigate to the feed page
3. Locate the feed post about the project
4. Click on the project link/card in the feed post
5. Verify navigation to the project detail page

**Expected Result**:
- ✓ Feed post displays project/funding/issue information
- ✓ Feed post includes clickable link or card for the entity
- ✓ Clicking the link navigates to the correct entity detail page
- ✓ Entity page displays correctly
- ✓ Navigation back to feed works properly

**UI Validation**:
- Entity reference is visually distinct (card, badge, or formatted link)
- Entity type is clearly indicated (project/funding/issue)
- Link hover state works correctly

---

## Test 16: Feed Respects Visibility Settings

**Objective**: Verify that only posts with `visibility = 'public'` are displayed in the feed

**Prerequisites**:
- Database access to manually insert test data

**Steps**:
1. Insert a test post with `visibility = 'public'` directly into the database
2. Insert a test post with `visibility = 'private'` (if future feature) or other value
3. Navigate to the feed page as logged out user
4. Navigate to the feed page as logged in user
5. Verify only public posts are visible

**Expected Result**:
- ✓ Only posts with `visibility = 'public'` appear in the feed
- ✓ Posts with other visibility values are not displayed
- ✓ No errors occur when rendering the feed
- ✓ Database constraint ensures only 'public' visibility in MVP

**Database Validation**:
```sql
-- Verify visibility constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%visibility%';

-- Expected: Constraint limiting visibility to 'public' only

-- Verify all feed posts have public visibility
SELECT id, visibility, COUNT(*)
FROM feed_posts
GROUP BY visibility;

-- Expected: Only 'public' visibility values exist
```

**Security Reminder**:
- Database constraint `feed_posts_visibility_check` enforces `visibility = 'public'`
- Future visibility options (private, followers-only) will require constraint updates

---

## Test 17: Feed Post Character Limits and Validation

**Objective**: Verify that feed posts enforce appropriate content length limits and validation

**Prerequisites**:
- User logged in

**Steps**:
1. Attempt to create a feed post with empty content
2. Attempt to create a feed post with very long content (test limit)
3. Attempt to create a feed post with special characters and emojis
4. Attempt to create a feed post with URLs and mentions
5. Create valid posts and verify they display correctly

**Expected Result**:
- ✓ Empty posts are rejected with validation error
- ✓ Excessively long posts are rejected or truncated (with notice)
- ✓ Special characters and emojis are handled correctly
- ✓ URLs are rendered as clickable links (if implemented)
- ✓ Content is properly sanitized to prevent XSS
- ✓ Error messages are clear and helpful

**UI Validation**:
- Character count display (if implemented)
- Validation messages appear inline
- Content rendering preserves line breaks and formatting

---

## Test 18: Feed Post Timestamps Display Correctly

**Objective**: Verify that feed posts display accurate timestamps and sort chronologically

**Prerequisites**:
- Multiple feed posts exist with different creation times

**Steps**:
1. Create several feed posts with time delays between them
2. Navigate to the feed page
3. Verify posts are ordered by most recent first
4. Check timestamp display format (e.g., "2 hours ago", "yesterday", full date)
5. Refresh the page and verify timestamps update

**Expected Result**:
- ✓ Posts are sorted by `published_at` descending (newest first)
- ✓ Timestamps display in user-friendly format
- ✓ Timestamps are accurate and timezone-aware
- ✓ Recent posts show relative time (e.g., "5 minutes ago")
- ✓ Older posts show full date/time
- ✓ Timestamps update on page refresh

**Database Validation**:
```sql
-- Verify posts are ordered correctly
SELECT id, content, published_at
FROM feed_posts
ORDER BY published_at DESC
LIMIT 10;

-- Expected: Results in descending chronological order
```

---

## Test 19: Organisation Post Shows Creator in Audit Trail

**Objective**: Verify that organisation posts maintain proper audit trail showing which user created the post

**Prerequisites**:
- User with admin/owner role in organisation

**Steps**:
1. Log in as organisation admin (User A)
2. Create a post as the organisation
3. Check database for post details
4. Verify both organisation attribution and user creator are recorded

**Expected Result**:
- ✓ Post displays organisation as the author in the UI
- ✓ Database records both `author_organisation_id` and `created_by`
- ✓ Audit trail shows which specific user created the post
- ✓ Organisation members can see who posted (if permissions allow)

**Database Validation**:
```sql
-- Verify post has both organisation and user attribution
SELECT fp.id, fp.author_organisation_id, fp.created_by,
       o.name as org_name, u.email as creator_email
FROM feed_posts fp
LEFT JOIN organisations o ON fp.author_organisation_id = o.id
LEFT JOIN auth.users u ON fp.created_by = u.id
WHERE fp.author_organisation_id IS NOT NULL
ORDER BY fp.created_at DESC
LIMIT 5;

-- Expected: Both author_organisation_id and created_by are populated
-- Expected: created_by matches the admin/owner who posted
```

**Security Reminder**:
- `created_by` must always be set to `auth.uid()` for accountability
- RLS policies enforce this constraint

---

## Summary

This test suite covers the core functionality of feed posting:

1. **Public Access**: Logged out users can view feed (Test 1)
2. **Individual Posting**: Authenticated users can post as themselves (Test 2)
3. **Organisation Posting**: Owners/admins can post as organisation (Tests 3-5)
4. **Integration**: Project/funding/issue creation with "Post to Feed" checkbox (Tests 6-8)
5. **Permissions**: Users cannot edit/delete others' posts (Tests 9-10, 11-13)
6. **Directory**: Public directory functionality unaffected (Test 14)
7. **Additional**: Entity links, visibility, validation, timestamps, audit trail (Tests 15-19)

## Notes for Testers

- Always verify database state using the provided SQL queries
- Test with different user roles to ensure proper access control
- Clear browser cache between tests to avoid stale UI states
- Document any bugs or unexpected behavior with screenshots
- Verify RLS policies are working correctly (security critical)

## Future Enhancements to Test

When implemented, add tests for:
- Feed post reactions/likes
- Feed post comments
- Feed post sharing
- Pagination and infinite scroll
- Feed filtering by entity type
- User mentions and notifications
- Image/media attachments
- Draft posts
- Scheduled posts
- Post analytics
