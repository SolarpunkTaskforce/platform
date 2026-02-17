# Organization Governance Manual Tests

This document provides comprehensive manual testing procedures for organization governance features, including signup, verification workflows, content creation restrictions, member management, and admin protection mechanisms.

## Prerequisites

1. Application running locally or on staging environment
2. Clean database state or ability to create new test accounts
3. Access to email inbox for confirmation testing (use temporary email service or test email account)
4. Multiple browser windows/incognito tabs for testing different user states
5. Admin access with `is_admin()=true` for verification testing
6. Database access for SQL validation queries

## Test Accounts Needed

- **Unauthenticated visitor**: Logged out browser session
- **New individual user**: Fresh account for personal signup testing
- **New organization creator**: Fresh account for organization signup testing
- **Organization admin**: User with admin role in an organization
- **Organization member**: User with member role (non-admin)
- **SolTas admin user**: Account with admin privileges (`is_admin()=true`)

---

## Test 1: Personal Signup Flow

**Objective**: Verify individual users can successfully sign up without creating an organization

**Steps**:
1. Navigate to `/signup`
2. Verify signup form displays with two tabs: "Individual" and "Organisation"
3. Ensure "Individual" tab is selected by default
4. Fill in the individual signup form:
   - First name: `Test`
   - Last name: `Individual`
   - Email: `test.individual+{timestamp}@example.com` (use unique email)
   - Password: `SecurePass123!`
   - Date of birth: Select a valid date (e.g., `1990-01-01`)
   - Organisation: Select "Independent / No organisation"
   - Country based: Select any country (e.g., `United States`)
   - Occupation: `Software Tester` (optional)
   - Bio: Leave blank (optional)
5. Click "Create account" button
6. Check email inbox for confirmation email
7. Click confirmation link in email
8. Verify redirect to application and user is logged in
9. Navigate to user profile page
10. Verify profile shows entered information correctly

**Expected Result**:
- ✓ Individual signup completes successfully
- ✓ User account created without organization affiliation
- ✓ Email confirmation works
- ✓ User can log in and view profile
- ✓ User is NOT automatically made an organization admin/owner

**Database Validation**:
```sql
-- Verify user created
SELECT id, email, email_confirmed_at FROM auth.users
WHERE email = 'test.individual+{timestamp}@example.com';

-- Verify profile created without organization
SELECT id, first_name, last_name, organisation_id
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'test.individual+{timestamp}@example.com');
-- Expected: organisation_id should be NULL

-- Verify user is NOT in organisation_members table
SELECT * FROM organisation_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test.individual+{timestamp}@example.com');
-- Expected: No rows returned
```

---

## Test 2: Create Organization (Pending Status)

**Objective**: Verify organization creation flow results in pending status and proper data setup

**Steps**:
1. Navigate to `/signup`
2. Click "Organisation" tab
3. Fill in organization signup form:
   - Email: `org.creator+{timestamp}@example.com` (use unique email)
   - Password: `SecurePass123!`
   - Organisation name: `Test Pending Organization`
   - Country based: Select any country (e.g., `Canada`)
   - Website: `https://testpendingorg.example.com` (optional)
   - What we do: `We are testing the pending organization verification workflow.`
4. Click "Create account" button
5. Complete email confirmation flow
6. Verify redirect to onboarding page (`/onboarding/organisation`)
7. Complete organization setup if prompted
8. Navigate to organization page
9. Verify organization displays with "Pending verification" badge/indicator
10. Note the organization ID for later tests

**Expected Result**:
- ✓ Organization created successfully
- ✓ Organization has `verification_status = 'pending'`
- ✓ Creator automatically becomes organization member with role='admin'
- ✓ All permission flags set to true for creator (can_create_projects, can_create_funding, can_create_issues, can_post_feed, can_manage_members)
- ✓ Organization visible to creator
- ✓ "Pending verification" status clearly indicated in UI

**Database Validation**:
```sql
-- Verify organization created with pending status
SELECT id, name, verification_status, created_by, verified_at, verified_by
FROM organisations
WHERE name = 'Test Pending Organization';
-- Expected: verification_status = 'pending', verified_at = NULL, verified_by = NULL

-- Verify creator is organization admin
SELECT om.role, om.user_id, om.can_create_projects, om.can_create_funding,
       om.can_create_issues, om.can_post_feed, om.can_manage_members
FROM organisation_members om
JOIN organisations o ON om.organisation_id = o.id
WHERE o.name = 'Test Pending Organization';
-- Expected: role = 'admin', all can_* flags = true

-- Verify organization NOT in verified_organisations view
SELECT id, name FROM verified_organisations
WHERE name = 'Test Pending Organization';
-- Expected: No rows returned (pending orgs excluded)
```

---

## Test 3: Pending Organization Cannot Create Content

**Objective**: Verify that pending (unverified) organizations are blocked from creating projects, funding, issues, and feed posts

**Prerequisites**:
- Pending organization from Test 2
- Logged in as organization admin/creator

### Part A: Cannot Create Organization-Owned Project

**Steps**:
1. Log in as creator of pending organization
2. Navigate to `/projects/new`
3. Fill in project form
4. In ownership section, select "Organisation" as owner type
5. Select "Test Pending Organization" from organization dropdown
6. Complete all required fields
7. Submit the project

**Expected Result**:
- ✗ Project creation FAILS
- ✓ Error message displayed indicating organization must be verified
- ✓ Database INSERT rejected by RLS policy

**Database Validation**:
```sql
-- Attempt to insert project as org admin (should fail)
-- This simulates what happens at DB level
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "{user_id}"}';

INSERT INTO projects (name, owner_type, owner_id, country_based, summary)
VALUES ('Test Project', 'organisation', '{pending_org_id}', 'Canada', 'Test summary');
-- Expected: ERROR - RLS policy violation (organization not verified)

-- Verify no project created for pending org
SELECT id, name, owner_type, owner_id FROM projects
WHERE owner_type = 'organisation'
  AND owner_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: No rows
```

### Part B: Cannot Create Organization-Owned Funding/Grant

**Steps**:
1. Navigate to `/funding/new`
2. Fill in grant/funding form
3. Select "Organisation" as owner type
4. Select "Test Pending Organization"
5. Complete all required fields
6. Submit the grant

**Expected Result**:
- ✗ Grant creation FAILS
- ✓ Error message displayed
- ✓ RLS policy blocks INSERT

**Database Validation**:
```sql
-- Verify no grant created for pending org
SELECT id, name, owner_type, owner_id FROM grants
WHERE owner_type = 'organisation'
  AND owner_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: No rows
```

### Part C: Cannot Create Organization-Owned Watchdog Issue

**Steps**:
1. Navigate to `/watchdog/new`
2. Fill in watchdog issue form
3. Select "Organisation" as owner type
4. Select "Test Pending Organization"
5. Complete all required fields
6. Submit the issue

**Expected Result**:
- ✗ Issue creation FAILS
- ✓ Error message displayed
- ✓ RLS policy blocks INSERT

**Database Validation**:
```sql
-- Verify no issue created for pending org
SELECT id, title, owner_type, owner_id FROM watchdog_issues
WHERE owner_type = 'organisation'
  AND owner_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: No rows
```

### Part D: Cannot Create Organization Feed Post

**Steps**:
1. Navigate to `/feed`
2. Click "New Post" or post composer
3. Attempt to select organization context (if UI allows)
4. Try to post as "Test Pending Organization"
5. Submit the post

**Expected Result**:
- ✗ Feed post creation as organization FAILS
- ✓ Either UI prevents selection of pending org, OR database INSERT fails
- ✓ RLS policy blocks INSERT

**Database Validation**:
```sql
-- Verify no feed post created for pending org
SELECT id, content, organisation_id FROM feed_posts
WHERE organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: No rows
```

**Note**: User CAN still create personal content (user-owned projects, grants, issues, personal feed posts) - only organization-owned content is blocked.

---

## Test 4: Submit Verification Evidence

**Objective**: Verify organization admin can submit verification evidence for review

**Prerequisites**:
- Pending organization from Test 2
- Logged in as organization admin

**Steps**:
1. Log in as organization admin/creator
2. Navigate to organization profile page (`/organisations/{id}`)
3. Look for "Submit for Verification" or "Request Verification" button/link
4. Click to open verification submission form
5. Fill in verification evidence:
   - Evidence type: Documentation, website proof, registration documents, etc.
   - Evidence description: `Official registration documents and website verification`
   - Upload supporting documents (if supported)
   - Additional notes: `Please review our organization for verification`
6. Submit verification request
7. Verify confirmation message displayed
8. Check that organization page shows "Verification pending" or "Under review" status

**Expected Result**:
- ✓ Organization admin can submit verification evidence
- ✓ Verification submission created with status='pending'
- ✓ Submission linked to organization and submitting user
- ✓ Organization status remains 'pending' (not auto-verified)
- ✓ UI indicates verification request submitted

**Database Validation**:
```sql
-- Verify verification submission created
SELECT ovs.id, ovs.organisation_id, ovs.submitted_by, ovs.status,
       ovs.evidence, ovs.created_at, ovs.reviewed_at, ovs.reviewed_by
FROM organisation_verification_submissions ovs
JOIN organisations o ON ovs.organisation_id = o.id
WHERE o.name = 'Test Pending Organization'
ORDER BY ovs.created_at DESC
LIMIT 1;
-- Expected: status = 'pending', submitted_by = current user ID, reviewed_at = NULL

-- Verify organization still pending
SELECT verification_status FROM organisations
WHERE name = 'Test Pending Organization';
-- Expected: 'pending' (unchanged)
```

**UI Validation**:
- Organization page shows verification submission status
- Admin cannot submit duplicate verification request (if already pending)
- Submission timestamp visible

---

## Test 5: Admin Approves → Organization Becomes Verified

**Objective**: Verify SolTas admin can approve verification and organization becomes verified

**Prerequisites**:
- Pending organization with verification submission from Test 4
- Logged in as SolTas admin (`is_admin()=true`)

**Steps**:
1. Log in as SolTas admin user
2. Navigate to admin organizations page (`/admin/organisations`)
3. Click "Pending" tab to view pending organizations
4. Locate "Test Pending Organization" in the list
5. Click to view organization details and verification submission
6. Review evidence and organization information
7. Click "Approve" or "Verify" button
8. Add optional admin notes: `Organization verified - documentation complete`
9. Confirm approval
10. Verify success message displayed
11. Check that organization moves to "Verified" tab
12. Log out and log back in as organization creator
13. Navigate to organization page
14. Verify "Verified" badge/indicator displayed

**Expected Result**:
- ✓ SolTas admin can access admin organizations page
- ✓ Pending organizations visible in admin dashboard
- ✓ Admin can approve verification
- ✓ Organization `verification_status` updated to 'verified'
- ✓ `verified_at` timestamp set
- ✓ `verified_by` set to admin user ID
- ✓ Verification submission status updated to 'approved'
- ✓ Organization now visible in public directory
- ✓ Organization appears in `verified_organisations` view

**Database Validation**:
```sql
-- Verify organization status changed to verified
SELECT id, name, verification_status, verified_at, verified_by
FROM organisations
WHERE name = 'Test Pending Organization';
-- Expected: verification_status = 'verified', verified_at = NOW, verified_by = admin_user_id

-- Verify verification submission marked as approved
SELECT status, reviewed_at, reviewed_by, admin_notes
FROM organisation_verification_submissions
WHERE organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization')
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status = 'approved', reviewed_at = NOW, reviewed_by = admin_user_id

-- Verify organization now in verified_organisations view
SELECT id, name, verification_status FROM verified_organisations
WHERE name = 'Test Pending Organization';
-- Expected: One row returned with verification_status = 'verified'
```

**Public Visibility Test**:
```sql
-- As logged out user, organization should now be visible
SELECT id, name FROM organisations
WHERE verification_status = 'verified' AND name = 'Test Pending Organization';
-- Expected: Organization visible
```

---

## Test 6: Verified Organization Can Create Content

**Objective**: Verify that verified organizations can now create projects, funding, issues, and feed posts

**Prerequisites**:
- Verified organization from Test 5
- Logged in as organization admin

### Part A: Can Create Organization-Owned Project

**Steps**:
1. Log in as organization admin
2. Navigate to `/projects/new`
3. Fill in project form
4. Select "Organisation" as owner type
5. Select "Test Pending Organization" (now verified)
6. Complete all required fields:
   - Name: `Verified Org Test Project`
   - Summary: `Testing project creation by verified organization`
   - Country: Select any country
   - Thematic areas: Select at least one
7. Submit the project

**Expected Result**:
- ✓ Project creation SUCCEEDS
- ✓ Project created with `owner_type='organisation'`
- ✓ Project visible on organization page
- ✓ No RLS errors

**Database Validation**:
```sql
-- Verify project created successfully
SELECT id, name, owner_type, owner_id, verification_status
FROM projects
WHERE name = 'Verified Org Test Project'
  AND owner_type = 'organisation';
-- Expected: One row with owner_id = verified org ID, verification_status = 'pending'
```

### Part B: Can Create Organization-Owned Grant

**Steps**:
1. Navigate to `/funding/new`
2. Fill in grant form
3. Select "Organisation" as owner type
4. Select verified organization
5. Complete required fields:
   - Name: `Verified Org Test Grant`
   - Amount: `$10,000`
   - Deadline: Future date
6. Submit

**Expected Result**:
- ✓ Grant creation SUCCEEDS
- ✓ Grant created with organization ownership

**Database Validation**:
```sql
-- Verify grant created
SELECT id, name, owner_type, owner_id FROM grants
WHERE name = 'Verified Org Test Grant';
-- Expected: One row with owner_type = 'organisation'
```

### Part C: Can Create Organization-Owned Watchdog Issue

**Steps**:
1. Navigate to `/watchdog/new`
2. Fill in issue form
3. Select "Organisation" as owner type
4. Select verified organization
5. Complete required fields:
   - Title: `Verified Org Test Issue`
   - Description: `Testing issue creation`
6. Submit

**Expected Result**:
- ✓ Issue creation SUCCEEDS
- ✓ Issue status = 'pending' (awaiting admin approval)

**Database Validation**:
```sql
-- Verify issue created
SELECT id, title, owner_type, owner_id, status FROM watchdog_issues
WHERE title = 'Verified Org Test Issue';
-- Expected: One row with owner_type = 'organisation', status = 'pending'
```

### Part D: Can Create Organization Feed Post

**Steps**:
1. Navigate to `/feed`
2. Open post composer
3. Select organization context (switch to organization identity)
4. Write post content: `Test feed post from verified organization`
5. Submit post

**Expected Result**:
- ✓ Feed post creation SUCCEEDS
- ✓ Post appears in feed with organization attribution
- ✓ Post visible to public

**Database Validation**:
```sql
-- Verify feed post created
SELECT id, content, organisation_id, created_by FROM feed_posts
WHERE organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: One row with content matching test post
```

**Summary**: After verification, organization can create all types of content that were previously blocked.

---

## Test 7: Join Verified Organization Request Workflow + Admin Approval

**Objective**: Verify user can request to join a verified organization and admin can approve the request

**Prerequisites**:
- Verified organization from Test 5
- New user account (not yet member of the organization)

### Part A: User Submits Join Request

**Steps**:
1. Create new user account: `new.member+{timestamp}@example.com`
2. Complete signup and email verification
3. Log in as the new user
4. Navigate to verified organization page (`/organisations/{id}`)
5. Look for "Request to Join" or "Join Organization" button
6. Click to open join request form
7. Fill in message: `I would like to join your organization to contribute to projects.`
8. Submit join request
9. Verify confirmation message displayed
10. Check that request appears in user's requests list (if available)

**Expected Result**:
- ✓ User can submit join request for verified organization
- ✓ Request created with status='pending'
- ✓ Request linked to user and organization
- ✓ Confirmation message shown
- ✓ User NOT automatically added to organization

**Database Validation**:
```sql
-- Verify join request created
SELECT omr.id, omr.organisation_id, omr.user_id, omr.status,
       omr.message, omr.created_at, omr.reviewed_at
FROM organisation_member_requests omr
WHERE omr.user_id = (SELECT id FROM auth.users WHERE email = 'new.member+{timestamp}@example.com')
  AND omr.organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization')
ORDER BY omr.created_at DESC
LIMIT 1;
-- Expected: status = 'pending', reviewed_at = NULL

-- Verify user NOT yet in organisation_members
SELECT * FROM organisation_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'new.member+{timestamp}@example.com');
-- Expected: No rows
```

### Part B: Organization Admin Views Pending Request

**Steps**:
1. Log in as organization admin
2. Navigate to organization members page (`/organisations/{id}/members`)
3. Look for "Pending Requests" section or tab
4. Verify join request from new user appears
5. Review request details (user name, message, request date)

**Expected Result**:
- ✓ Admin can view pending join requests
- ✓ Request details visible (user info, message, timestamp)
- ✓ Actions available: Approve, Reject

### Part C: Organization Admin Approves Request

**Steps**:
1. While on members page as admin
2. Click "Approve" button for the pending request
3. Select member role: "Member" (not admin)
4. Optionally configure permissions:
   - can_create_projects: false
   - can_create_funding: false
   - can_create_issues: false
   - can_post_feed: false
   - can_manage_members: false
5. Confirm approval
6. Verify success message
7. Check that user now appears in members list
8. Log in as the newly added member
9. Navigate to `/me/organisations`
10. Verify organization appears in user's organizations list

**Expected Result**:
- ✓ Admin with `can_manage_members=true` can approve request
- ✓ New member added to `organisation_members` table
- ✓ Member has role='member' (not admin)
- ✓ Permission flags set according to admin selection
- ✓ Join request status updated to 'approved'
- ✓ Request `reviewed_at` and `reviewed_by` fields set
- ✓ User can now access organization pages as member

**Database Validation**:
```sql
-- Verify member added to organisation_members
SELECT om.organisation_id, om.user_id, om.role,
       om.can_create_projects, om.can_create_funding,
       om.can_create_issues, om.can_post_feed, om.can_manage_members
FROM organisation_members om
WHERE om.user_id = (SELECT id FROM auth.users WHERE email = 'new.member+{timestamp}@example.com')
  AND om.organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization');
-- Expected: role = 'member', permission flags as configured

-- Verify join request marked as approved
SELECT status, reviewed_at, reviewed_by FROM organisation_member_requests
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'new.member+{timestamp}@example.com')
  AND organisation_id = (SELECT id FROM organisations WHERE name = 'Test Pending Organization')
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status = 'approved', reviewed_at = NOW, reviewed_by = admin_user_id
```

### Part D: Organization Admin Rejects Request (Alternative Flow)

**Steps** (with a different user):
1. Create another new user account
2. Submit join request to organization
3. Log in as organization admin
4. View pending requests
5. Click "Reject" button for the request
6. Add optional admin notes: `Not accepting new members at this time`
7. Confirm rejection
8. Verify request disappears from pending list

**Expected Result**:
- ✓ Admin can reject join requests
- ✓ Request status updated to 'rejected'
- ✓ User NOT added to organization
- ✓ Request remains in database but marked rejected

**Database Validation**:
```sql
-- Verify request rejected, user not added
SELECT status, reviewed_at, reviewed_by, admin_notes
FROM organisation_member_requests
WHERE user_id = (SELECT id FROM auth.users WHERE email = '{rejected_user_email}');
-- Expected: status = 'rejected'

-- Verify user NOT in organisation_members
SELECT * FROM organisation_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = '{rejected_user_email}');
-- Expected: No rows
```

---

## Test 8: Last Admin Protection (Cannot Remove Last Admin)

**Objective**: Verify that the last admin of an organization cannot be removed or demoted to prevent orphaned organizations

**Prerequisites**:
- Organization with exactly ONE admin member
- Logged in as that admin OR as another admin who will test removing them

### Part A: Setup - Organization with One Admin

**Steps**:
1. Create or identify an organization with only one admin
2. If organization has multiple admins, demote all but one to 'member' role
3. Verify exactly one member has role='admin'
4. Note the admin user ID

**Database Validation**:
```sql
-- Count admins in organization
SELECT COUNT(*) FROM organisation_members
WHERE organisation_id = '{org_id}' AND role = 'admin';
-- Expected: Exactly 1

-- Identify the last admin
SELECT user_id, role FROM organisation_members
WHERE organisation_id = '{org_id}' AND role = 'admin';
```

### Part B: Attempt to Remove Last Admin (Should Fail)

**Steps**:
1. Navigate to organization members page (`/organisations/{id}/members`)
2. Locate the last admin in members list
3. Click "Remove" or "Delete" button for that admin
4. Confirm deletion attempt

**Expected Result**:
- ✗ Deletion FAILS
- ✓ Error message displayed: "Cannot remove the last admin of the organization"
- ✓ Database trigger `enforce_at_least_one_admin()` prevents deletion
- ✓ Admin remains in members list

**Database Validation**:
```sql
-- Attempt to delete last admin (should fail)
DELETE FROM organisation_members
WHERE organisation_id = '{org_id}' AND user_id = '{last_admin_user_id}';
-- Expected: ERROR - triggered by enforce_at_least_one_admin_trigger

-- Verify admin still exists
SELECT user_id, role FROM organisation_members
WHERE organisation_id = '{org_id}' AND user_id = '{last_admin_user_id}';
-- Expected: One row with role = 'admin'
```

### Part C: Attempt to Demote Last Admin to Member (Should Fail)

**Steps**:
1. On members page, locate the last admin
2. Click "Change Role" or "Edit" button
3. Attempt to change role from 'admin' to 'member'
4. Save changes

**Expected Result**:
- ✗ Role change FAILS
- ✓ Error message displayed: "Cannot demote the last admin"
- ✓ Database trigger prevents role change
- ✓ User remains as admin

**Database Validation**:
```sql
-- Attempt to update last admin to member (should fail)
UPDATE organisation_members
SET role = 'member'
WHERE organisation_id = '{org_id}' AND user_id = '{last_admin_user_id}';
-- Expected: ERROR - triggered by enforce_at_least_one_admin_trigger

-- Verify role unchanged
SELECT role FROM organisation_members
WHERE organisation_id = '{org_id}' AND user_id = '{last_admin_user_id}';
-- Expected: 'admin'
```

### Part D: Add Second Admin, Then Remove Original Admin (Should Succeed)

**Steps**:
1. Add a new member to the organization OR promote existing member
2. Set new member role to 'admin' with appropriate permissions
3. Verify organization now has TWO admins
4. Attempt to remove or demote the original admin
5. Confirm deletion/demotion

**Expected Result**:
- ✓ With multiple admins, removal/demotion SUCCEEDS
- ✓ Organization still has at least one admin
- ✓ No error from database trigger
- ✓ Organization not orphaned

**Database Validation**:
```sql
-- Verify two admins exist
SELECT user_id, role FROM organisation_members
WHERE organisation_id = '{org_id}' AND role = 'admin';
-- Expected: Two rows

-- Remove first admin (should succeed)
DELETE FROM organisation_members
WHERE organisation_id = '{org_id}' AND user_id = '{first_admin_user_id}';
-- Expected: Success

-- Verify one admin remains
SELECT COUNT(*) FROM organisation_members
WHERE organisation_id = '{org_id}' AND role = 'admin';
-- Expected: 1 (at least)
```

### Part E: Edge Case - Admin Leaves Organization (Self-Removal)

**Steps**:
1. Log in as the last admin of an organization
2. Navigate to organization members page
3. Attempt to remove yourself (leave organization)
4. Confirm leave action

**Expected Result**:
- ✗ Self-removal FAILS if you are the last admin
- ✓ Error message: "Cannot leave - you are the last admin"
- ✓ UI may display warning before allowing action
- ✓ Database trigger prevents orphaning

**Database Validation**:
```sql
-- Verify trigger prevents self-removal when last admin
-- Same trigger applies regardless of who initiates the deletion
```

---

## Test 9: Permission-Based Content Creation

**Objective**: Verify that organization members can only create content if they have the appropriate permission flags

**Prerequisites**:
- Verified organization
- Organization member with role='member' (not admin)
- Member has some permissions disabled

### Part A: Member Without can_create_projects Cannot Create Project

**Steps**:
1. Create organization member with:
   - role='member'
   - can_create_projects=FALSE
   - can_create_funding=FALSE
   - can_create_issues=FALSE
   - can_post_feed=FALSE
2. Log in as that member
3. Navigate to `/projects/new`
4. Attempt to create organization-owned project
5. Submit form

**Expected Result**:
- ✗ Project creation FAILS
- ✓ Error message: "You do not have permission to create projects for this organization"
- ✓ RLS policy blocks INSERT (permission check)

**Database Validation**:
```sql
-- Verify member lacks permission
SELECT can_create_projects FROM organisation_members
WHERE user_id = '{member_user_id}' AND organisation_id = '{org_id}';
-- Expected: false

-- Attempt insert should fail due to permission check in RLS
```

### Part B: Admin Grants Permission, Member Can Now Create

**Steps**:
1. Log in as organization admin
2. Navigate to members page
3. Edit member permissions
4. Enable can_create_projects flag
5. Save changes
6. Log back in as member
7. Attempt to create organization-owned project
8. Submit form

**Expected Result**:
- ✓ Permission update SUCCEEDS
- ✓ Member can now create organization-owned projects
- ✓ RLS policy allows INSERT

**Database Validation**:
```sql
-- Verify permission granted
SELECT can_create_projects FROM organisation_members
WHERE user_id = '{member_user_id}' AND organisation_id = '{org_id}';
-- Expected: true

-- Verify project created successfully
SELECT id, name, owner_type, owner_id FROM projects
WHERE owner_type = 'organisation' AND owner_id = '{org_id}'
  AND name = '{test_project_name}';
-- Expected: One row
```

### Part C: Test All Permission Flags

Repeat similar tests for:
- `can_create_funding` → grants/funding creation
- `can_create_issues` → watchdog issues creation
- `can_post_feed` → organization feed posts
- `can_manage_members` → member management actions

**Expected**: Each permission flag correctly gates the corresponding action.

---

## Test 10: Organization Verification Rejection Flow

**Objective**: Verify admin can reject verification submissions and organization remains unverified

**Prerequisites**:
- Pending organization with verification submission
- SolTas admin account

**Steps**:
1. Log in as SolTas admin
2. Navigate to `/admin/organisations`
3. View pending organization verification submission
4. Review submitted evidence
5. Click "Reject" button
6. Add admin notes: `Insufficient verification evidence provided`
7. Confirm rejection
8. Verify organization remains in "Pending" or "Rejected" tab
9. Log in as organization creator
10. Check organization status

**Expected Result**:
- ✓ Admin can reject verification submissions
- ✓ Verification submission status updated to 'rejected'
- ✓ Organization `verification_status` may be set to 'rejected' or remain 'pending'
- ✓ Organization still cannot create content
- ✓ Admin notes stored for reference

**Database Validation**:
```sql
-- Verify submission rejected
SELECT status, reviewed_at, reviewed_by, admin_notes
FROM organisation_verification_submissions
WHERE organisation_id = '{org_id}'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status = 'rejected', admin_notes present

-- Verify organization not verified
SELECT verification_status FROM organisations WHERE id = '{org_id}';
-- Expected: 'pending' or 'rejected' (not 'verified')

-- Verify org still not in verified_organisations view
SELECT id FROM verified_organisations WHERE id = '{org_id}';
-- Expected: No rows
```

---

## Test Results Template

Use this template to record test execution results:

```
Test #: [Number and Name]
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Local/Staging/Production]
Database: [PostgreSQL version]
Result: [PASS/FAIL/PARTIAL]

Steps Completed:
- [x] Step 1
- [x] Step 2
- [ ] Step 3 (failed - see notes)

Issues Found:
- [Description of bugs or unexpected behavior]
- [Error messages encountered]

Database Queries Executed:
- [List of validation queries run]

Screenshots/Evidence:
- [Links or file paths to screenshots]

Notes:
- [Additional observations]
- [Recommendations for fixes]
```

---

## Troubleshooting

### Common Issues

**Organization stuck in pending status**:
- Verify verification submission exists in `organisation_verification_submissions`
- Check if admin has reviewed the submission
- Verify SolTas admin has `is_admin()=true` permission
- Check for database constraint violations

**Cannot create content even with verified organization**:
- Verify organization `verification_status = 'verified'` in database
- Check user is organization member with appropriate permission flags
- Verify RLS policies enabled on content tables
- Check for JavaScript errors in browser console
- Test with `SET LOCAL` to simulate authenticated user context

**Last admin protection not working**:
- Verify `enforce_at_least_one_admin_trigger` exists and is enabled
- Check trigger function `enforce_at_least_one_admin()` is defined
- Test trigger with direct SQL DELETE/UPDATE commands
- Verify organization has exactly one admin before testing

**Join requests not appearing**:
- Verify user is authenticated
- Check `organisation_member_requests` table for request record
- Verify admin has `can_manage_members=true` permission
- Check RLS policies on `organisation_member_requests` table

**Permission flags not working**:
- Verify flags set correctly in `organisation_members` table
- Check RLS policies include permission flag checks
- Verify organization is verified (permissions only apply to verified orgs)
- Test with SQL to isolate RLS vs application logic issues

**Verification submission errors**:
- Check user is organization admin
- Verify organization is pending (not already verified/rejected)
- Check for duplicate submissions (may need to prevent duplicates)
- Verify JSONB evidence field accepts provided data structure

---

## RLS Policy Testing Tips

### Testing RLS Policies Directly in SQL

You can test RLS policies by simulating different user contexts:

```sql
-- Test as logged out user
RESET role;
SELECT * FROM organisations WHERE verification_status = 'pending';
-- Expected: No pending orgs visible

-- Test as specific authenticated user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "{user_uuid}"}';
SELECT * FROM organisations WHERE created_by = '{user_uuid}';
-- Expected: User's own orgs visible

-- Test as admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "{admin_uuid}"}';
-- Assuming admin has is_admin()=true
SELECT * FROM organisations;
-- Expected: All orgs visible

-- Reset after testing
RESET role;
```

### Verifying Trigger Functions

```sql
-- Check if trigger exists
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'enforce_at_least_one_admin_trigger';

-- View trigger function
\df+ enforce_at_least_one_admin

-- Test trigger by attempting violation
BEGIN;
DELETE FROM organisation_members
WHERE organisation_id = '{org_id}' AND role = 'admin';
-- Should fail if only one admin
ROLLBACK;
```

---

## Security Reminders

🔒 **Critical**: Pending and rejected organizations MUST NOT be able to create content (projects, grants, issues, feed posts). Any failure of this restriction is a **security vulnerability** that allows unverified entities to publish content.

🔒 **Critical**: Only SolTas admins with `is_admin()=true` should be able to verify organizations. Regular users must NOT be able to change their organization's verification status.

🔒 **Critical**: Organizations must always have at least one admin. The `enforce_at_least_one_admin()` trigger is essential to prevent orphaned organizations.

🔒 **Important**: Member permissions (`can_create_*`, `can_manage_members`) must be enforced at the database level via RLS policies, not just in the UI.

🔒 **Important**: Verification submissions and member requests should only be modifiable by appropriate roles (org admins for submissions, SolTas admins for approvals).

---

## Related Documentation

- See `organisation-signup.md` for detailed signup flow testing
- See `organisation-ui.md` for UI component testing
- See `../rls-matrix.md` for complete RLS policy matrix
- See `../smoke-tests.md` for Phase 1-5 feature testing
- See Supabase migrations in `/supabase/migrations/` for schema details
- See `/supabase/migrations/20260321120007_org_verified_gating_rls.sql` for verification RLS policies

---

## Test Execution Checklist

Use this checklist to track overall testing progress:

```
Organization Governance Testing Progress

Core Workflows:
- [ ] Test 1: Personal signup flow
- [ ] Test 2: Create organization (pending status)
- [ ] Test 3: Pending org cannot create content
  - [ ] Cannot create projects
  - [ ] Cannot create funding
  - [ ] Cannot create issues
  - [ ] Cannot create feed posts
- [ ] Test 4: Submit verification evidence
- [ ] Test 5: Admin approves → org becomes verified
- [ ] Test 6: Verified org can create content
  - [ ] Can create projects
  - [ ] Can create funding
  - [ ] Can create issues
  - [ ] Can create feed posts
- [ ] Test 7: Join verified org request workflow
  - [ ] User submits join request
  - [ ] Admin views pending request
  - [ ] Admin approves request
  - [ ] Admin rejects request (alternative)
- [ ] Test 8: Last admin protection
  - [ ] Cannot remove last admin
  - [ ] Cannot demote last admin
  - [ ] Can remove admin when multiple exist

Additional Tests:
- [ ] Test 9: Permission-based content creation
- [ ] Test 10: Organization verification rejection flow

Database Validations:
- [ ] All SQL validation queries executed
- [ ] RLS policies tested with SET LOCAL
- [ ] Triggers verified with direct SQL attempts
- [ ] Views tested for correct filtering

Security Checks:
- [ ] Pending orgs cannot bypass verification
- [ ] Non-admins cannot verify organizations
- [ ] Permission flags enforced at DB level
- [ ] Last admin protection working
- [ ] No data leakage of pending/rejected orgs
```
