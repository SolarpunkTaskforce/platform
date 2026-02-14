# Smoke Tests for Phase 1 & Phase 2

This document provides step-by-step manual smoke tests to verify core functionality before and after Phase 2 integration.

## Prerequisites

1. Application running locally or on staging environment
2. Test accounts created:
   - Unauthenticated visitor (logged out)
   - Standard authenticated user
   - User who owns projects
   - Admin user

## Phase 1 Smoke Tests

### Test 1: Feed Page - Tab Navigation

**Objective**: Verify feed tabs display correctly and handle URL parameters

**Steps**:
1. Navigate to `/feed`
2. Verify you see the activity feed page
3. Check that tabs are visible:
   - "For you" tab (if logged in)
   - "Global" tab
4. Click "Global" tab
5. Verify URL updates to include `?tab=global`
6. Click "For you" tab (if logged in)
7. Verify URL updates to include `?tab=for_you`
8. Refresh the page
9. Verify the correct tab remains active based on URL parameter

**Expected Result**:
- Tabs display correctly
- URL parameters update on tab click
- Page state persists after refresh

---

### Test 2: Feed Page - Empty States (Logged Out)

**Objective**: Verify empty states display when no content exists

**Steps**:
1. Log out if logged in
2. Navigate to `/feed`
3. Observe the feed content area

**Expected Result**:
- If no global updates exist, appropriate empty state message displays
- Empty state is clear and user-friendly
- No errors in browser console

---

### Test 3: Feed Page - Empty States (Logged In)

**Objective**: Verify "For you" empty state when user follows nothing

**Steps**:
1. Log in with a new user account that follows no one
2. Navigate to `/feed`
3. Select "For you" tab
4. Observe the feed content area

**Expected Result**:
- Empty state message explains no followed content
- Suggestions to follow projects/organisations may appear
- No errors in browser console

---

### Test 4: Project Page - Updates Section

**Objective**: Verify Updates section appears on project pages

**Steps**:
1. Navigate to any approved project page (e.g., `/projects/[slug]`)
2. Scroll to find the "Updates" section
3. Verify section heading is visible

**Expected Result**:
- "Updates" section is present on project page
- Section displays appropriately (empty state or list of updates)
- Section layout matches design specifications

---

### Test 5: Organisation Page - Updates Section

**Objective**: Verify Updates section visibility on organisation pages

**Steps**:
1. Navigate to any verified organisation page (e.g., `/organisations/[slug]`)
2. Scroll to find updates or activity section
3. Check for presence of organisation posts/updates

**Expected Result**:
- Updates or posts section is visible
- Content displays appropriately
- Layout is consistent with other entity pages

---

### Test 6: Issue/Watchdog Page - Updates Section

**Objective**: Verify Updates section on watchdog issue pages (when implemented)

**Steps**:
1. Navigate to a watchdog issue page (if feature exists)
2. Look for Updates section

**Expected Result**:
- Updates section present or feature not yet implemented
- No broken UI elements

---

### Test 7: Follow Button Functionality

**Objective**: Verify users can follow and unfollow entities

**Steps**:
1. Log in as standard user
2. Navigate to a project page
3. Locate the "Follow" button
4. Click "Follow"
5. Verify button changes to "Following" or shows checkmark
6. Click "Following" button to unfollow
7. Verify button returns to "Follow" state
8. Repeat for organisation page

**Expected Result**:
- Follow button toggles correctly
- Visual feedback on state change
- No errors occur
- Changes persist on page refresh

---

### Test 8: Activity Feed - Global Tab Content

**Objective**: Verify global feed displays public updates

**Steps**:
1. As logged-in or logged-out user, navigate to `/feed?tab=global`
2. Observe content in the feed
3. Verify updates from various projects appear
4. Check that update cards show:
   - Project name
   - Update title
   - Update preview/body
   - Timestamp
   - Author information

**Expected Result**:
- Public project updates display in reverse chronological order
- Update cards render correctly
- All expected fields are visible

---

## Phase 2 Smoke Tests (Mark as Future)

### Test 9: Create Update (Phase 2)

**Objective**: Verify project owners can create updates

**Steps**:
1. Log in as user who owns a project
2. Navigate to owned project page
3. Click "New update" or "Create update" button
4. Fill in update form:
   - Title
   - Body/content
   - Visibility setting
5. Click "Publish" or "Save"
6. Verify update appears in project's Updates section
7. Navigate to `/feed`
8. Verify update appears in feed

**Expected Result**:
- Update creation form works
- Update saves successfully
- Update appears on project page
- Update appears in global feed (if public)
- Followers receive notification (if implemented)

**Status**: ⏸️ Phase 2 - Not yet implemented

---

### Test 10: Like an Update (Phase 2)

**Objective**: Verify users can like updates

**Steps**:
1. Log in as standard user
2. Navigate to `/feed`
3. Find an update card
4. Click the "Like" or heart icon
5. Verify like count increments
6. Click again to unlike
7. Verify like count decrements

**Expected Result**:
- Like button toggles correctly
- Like count updates in real-time
- Changes persist

**Status**: ⏸️ Phase 2 - Not yet implemented

---

### Test 11: Comment on Update (Phase 2)

**Objective**: Verify users can comment on updates

**Steps**:
1. Log in as standard user
2. Navigate to an update detail page or feed
3. Locate comment input field
4. Type a comment
5. Submit comment
6. Verify comment appears below update

**Expected Result**:
- Comment input works
- Comment saves and displays
- Commenter info shown correctly

**Status**: ⏸️ Phase 2 - Not yet implemented

---

## Test Results Template

Use this template to record test results:

```
Test #: [Number]
Test Name: [Name]
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Local/Staging/Production]
Result: [PASS/FAIL]
Notes: [Any observations or issues]
```

## Troubleshooting

### Common Issues

**Feed page shows blank**: Check browser console for errors. Verify Supabase connection.

**Follow button doesn't work**: Ensure user is logged in. Check RLS policies on `follow_edges` table.

**Updates don't appear**: Verify project is approved. Check `project_updates` visibility setting and RLS policies.

**Empty states not showing**: Check conditional rendering logic in feed components.

## Related Documentation

- See `rls-matrix.md` for security policy expectations
- See `phase1-ui-checklist.md` for comprehensive UI component checks
