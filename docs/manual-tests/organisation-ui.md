# Organisation UI Manual Tests

This document provides comprehensive manual testing procedures for organisation-related UI features, navigation menus, access control, and user experience flows.

## Prerequisites

1. Application running locally or on staging environment
2. Clean database state or ability to create new test accounts
3. At least one verified organisation in the database
4. At least one pending organisation in the database
5. Multiple browser windows/incognito tabs for testing different user states
6. Admin access for admin-specific features

## Test Accounts Needed

- **Unauthenticated visitor**: Logged out browser session
- **New user (no orgs)**: Fresh account with no organisation memberships
- **User with pending org**: User who created a pending organisation
- **Organisation member**: User with member role in an organisation
- **Organisation admin**: User with admin role in an organisation
- **Organisation owner**: User with owner role in an organisation
- **Admin/superadmin user**: Account with admin privileges

---

## Test 1: User Menu - Personal Links (No Organisation Context)

**Objective**: Verify menu displays correct personal links when user has no organisation memberships

**Prerequisites**: User account with no organisation memberships

**Steps**:
1. Log in as user with no organisation memberships
2. Click on user avatar/menu in the top navigation bar
3. Observe the menu items displayed

**Expected Result**:
- ✓ "My profile" link present → navigates to `/profile`
- ✓ "My organisations" link present → navigates to `/me/organisations`
- ✓ Divider separator present
- ✓ "Create organisation" link present → navigates to `/onboarding/organisation`
- ✓ No organisation-specific links visible
- ✓ If user is admin: "Project Registrations", "Issue Registrations", and possibly "Manage Admins" links present
- ✓ Menu opens and closes smoothly
- ✓ All links are clickable and navigate correctly

**UI Validation**:
- Personal links section always appears at top
- "Create organisation" appears when user has no organisations
- No "Organisation profile", "Edit organisation", or "Members" links visible

---

## Test 2: User Menu - Organisation Context (Member)

**Objective**: Verify menu displays organisation links when user is a member of an organisation

**Prerequisites**: User account with member role (not admin/owner) in at least one organisation

**Steps**:
1. Log in as user with member role in an organisation
2. Click on user avatar/menu in the top navigation bar
3. Observe the menu items displayed

**Expected Result**:
- ✓ "My profile" link present
- ✓ "My organisations" link present
- ✓ Divider separator present
- ✓ "Organisation profile" link present → navigates to `/organisations/{org-id}`
- ✗ "Edit organisation" link NOT present (member cannot edit)
- ✗ "Members" link NOT present (member cannot manage members)
- ✗ "Create organisation" link NOT present (user already has org membership)
- ✓ Menu shows first organisation with owner/admin role, or first org if none

**UI Validation**:
- Organisation links appear after divider
- Only "Organisation profile" visible for members (no edit/management links)
- If user has multiple orgs: menu shows the first org with owner/admin role

---

## Test 3: User Menu - Organisation Context (Admin/Owner)

**Objective**: Verify menu displays full organisation management links for admin/owner users

**Prerequisites**: User account with admin or owner role in an organisation

**Steps**:
1. Log in as user with admin or owner role in an organisation
2. Click on user avatar/menu in the top navigation bar
3. Observe the menu items displayed

**Expected Result**:
- ✓ "My profile" link present
- ✓ "My organisations" link present
- ✓ Divider separator present
- ✓ "Organisation profile" link present → navigates to `/organisations/{org-id}`
- ✓ "Edit organisation" link present → navigates to `/organisations/{org-id}/edit`
- ✓ "Members" link present → navigates to `/organisations/{org-id}/members`
- ✗ "Create organisation" link NOT present (user already has org)
- ✓ Menu selects active org with owner/admin priority

**UI Validation**:
- Full organisation management links visible for admin/owner
- "Edit organisation" and "Members" links only appear for users with canManageOrg permission
- Active org selection prioritizes owner/admin roles over member roles

**Database Validation**:
```sql
-- Verify user's role in organisation
SELECT role, can_create_projects, can_create_funding
FROM organisation_members
WHERE user_id = auth.uid() AND organisation_id = [org-id];
-- Expected: role = 'owner' OR role = 'admin'
```

---

## Test 4: User Menu - Multiple Organisations

**Objective**: Verify menu correctly selects and displays the active organisation when user is member of multiple orgs

**Prerequisites**: User account with memberships in multiple organisations (ideally with different roles)

**Steps**:
1. Create test scenario:
   - User is member (not admin) of Organisation A
   - User is admin of Organisation B
   - User is owner of Organisation C
2. Log in as this user
3. Open user menu
4. Observe which organisation appears in the menu context

**Expected Result**:
- ✓ Menu displays organisation links for the "active" org
- ✓ Active org selection logic:
  - First selects org where user is owner
  - Falls back to org where user is admin
  - Falls back to first org where user is member
- ✓ "Organisation profile" link points to the active org
- ✓ "Edit organisation" and "Members" links appear if user has admin/owner role in active org
- ✓ User can access all orgs via "My organisations" page

**UI Validation**:
- Only one organisation's links shown in menu at a time
- User can navigate to other orgs via `/me/organisations` page
- Active org prioritizes higher permission roles

---

## Test 5: /me/organisations Page - No Organisations

**Objective**: Verify empty state displays correctly when user has no organisation memberships

**Steps**:
1. Log in as user with no organisation memberships
2. Navigate to `/me/organisations`
3. Observe the page content

**Expected Result**:
- ✓ Page loads successfully
- ✓ Empty state message displayed: "You are not a member of any organisations yet"
- ✓ Call-to-action button/link present: "Create organisation" or similar
- ✓ CTA navigates to `/onboarding/organisation`
- ✓ No organisation cards displayed
- ✓ No errors in browser console

**UI Validation**:
- Empty state is user-friendly and clear
- CTA is prominent and easy to find
- Page does not show loading state indefinitely

---

## Test 6: /me/organisations Page - With Organisations

**Objective**: Verify page displays user's organisation memberships with correct details

**Prerequisites**: User account with memberships in one or more organisations

**Steps**:
1. Log in as user with at least one organisation membership
2. Navigate to `/me/organisations`
3. Observe the organisation cards displayed

**Expected Result**:
- ✓ Page displays one card per organisation membership
- ✓ Each card shows:
  - Organisation logo (with fallback icon if no logo)
  - Organisation name
  - "Verified" badge if `verification_status === "verified"`
  - User's role in the org (owner, admin, or member)
  - Country based
  - Permission badges: "Can create projects" (if applicable)
  - Permission badges: "Can create funding" (if applicable)
- ✓ Cards sorted by role: owner first, then admin, then member
- ✓ Bottom CTA: "Want to start a new organisation?" with link to `/onboarding/organisation`
- ✓ Clicking card navigates to organisation profile page

**UI Validation**:
- Logo displays correctly or shows fallback icon
- Verified badge appears only for verified organisations
- Role labels are clear and accurate
- Permission badges match user's actual permissions

**Database Validation**:
```sql
-- Verify organisation memberships
SELECT om.organisation_id, om.role, om.can_create_projects, om.can_create_funding,
       o.name, o.logo_url, o.verification_status, o.country_based
FROM organisation_members om
JOIN organisations o ON om.organisation_id = o.id
WHERE om.user_id = auth.uid()
ORDER BY om.role ASC;
-- Expected: All user's organisation memberships with correct data
```

---

## Test 7: /me/organisations Page - Pending Organisation Display

**Objective**: Verify pending organisations display correctly for creator on their organisations page

**Prerequisites**:
- User who created a pending organisation
- Pending organisation exists in database with `verification_status = 'pending'`

**Steps**:
1. Log in as user who created the pending organisation
2. Navigate to `/me/organisations`
3. Observe the pending organisation card

**Expected Result**:
- ✓ Pending organisation appears in the list
- ✓ Organisation card shows all standard information
- ✗ "Verified" badge NOT present (or shows "Pending" badge/indicator)
- ✓ User's role shows as "owner" (creator is automatically owner)
- ✓ Clicking card navigates to organisation profile page
- ✓ Creator can access and view their pending organisation

**UI Validation**:
- Pending status clearly indicated (no verified badge, or explicit "Pending" indicator)
- User understands the organisation is awaiting verification
- Organisation is accessible to creator despite pending status

**Database Validation**:
```sql
-- Verify pending organisation membership
SELECT om.role, o.verification_status
FROM organisation_members om
JOIN organisations o ON om.organisation_id = o.id
WHERE om.user_id = auth.uid() AND o.verification_status = 'pending';
-- Expected: User has membership with owner role in pending org
```

---

## Test 8: Create Organisation Entrypoint - Authenticated User

**Objective**: Verify authenticated users can create organisations directly without going through signup

**Prerequisites**: Authenticated user account (can have existing org memberships or not)

**Steps**:
1. Log in as authenticated user
2. Navigate to `/organisations/create` directly
3. Observe the create organisation form
4. Fill in the form:
   - Name: `Test Direct Create Org`
   - Country Based: Select any country (e.g., `Germany`)
   - What We Do: `We are testing direct organisation creation for authenticated users.`
   - Existing Since: `2020` (optional)
   - Website: `https://testdirectcreate.example.com` (optional)
   - Logo URL: Leave blank (optional)
   - Social Links: Add one (optional, e.g., Twitter)
5. Click "Create Organisation" or submit button
6. Observe the result

**Expected Result**:
- ✓ Create form loads successfully for authenticated user
- ✓ Form accepts all input values
- ✓ Form validation works (required fields: name, country, what we do)
- ✓ Submission calls edge function: `POST /functions/v1/create-organisation`
- ✓ On success: redirects to `/organisations/{new-org-id}`
- ✓ New organisation created with `verification_status = 'pending'`
- ✓ User automatically assigned as owner
- ✓ Organisation page displays entered information
- ✓ No errors during creation process

**UI Validation**:
- Required fields marked clearly
- Form validation provides helpful error messages
- Success redirect happens smoothly
- New organisation immediately accessible to creator

**Database Validation**:
```sql
-- Verify organisation created
SELECT id, name, verification_status, created_by, country_based, what_we_do
FROM organisations
WHERE name = 'Test Direct Create Org';
-- Expected: verification_status = 'pending', created_by = current user

-- Verify user is owner
SELECT role FROM organisation_members
WHERE organisation_id = (SELECT id FROM organisations WHERE name = 'Test Direct Create Org')
  AND user_id = auth.uid();
-- Expected: role = 'owner'
```

---

## Test 9: Create Organisation Entrypoint - Unauthenticated User

**Objective**: Verify unauthenticated users are redirected to login when accessing create org route

**Steps**:
1. Log out completely
2. Navigate to `/organisations/create` directly
3. Observe the result

**Expected Result**:
- ✓ Page does NOT display create form
- ✓ User redirected to `/login` or authentication page
- ✓ After login, user redirected back to create form (or onboarding flow)
- ✓ Protected route enforced correctly

---

## Test 10: Signup with Organisation Tab (Without Email Confirmation)

**Objective**: Verify signup flow with organisation tab creates pending org in user metadata

**Prerequisites**: Supabase configured for immediate session (no email confirmation required - rare case)

**Steps**:
1. Log out completely
2. Navigate to `/signup`
3. Click "Organisation" tab
4. Fill in organisation signup form:
   - Email: `testsignuporg+immediate@example.com`
   - Password: `SecurePass123!`
   - Organisation name: `Test Signup Immediate Org`
   - Country based: Select any country
   - What we do: `Testing signup with immediate session creation.`
5. Click "Create account"
6. **If immediate session granted** (no email confirmation):
   - Observe redirect to `/onboarding/organisation`
   - Verify "Setting up..." or "Creating your organisation..." loading state
   - Verify redirect to new organisation page
7. Navigate to organisation page
8. Verify organisation data matches entered information

**Expected Result**:
- ✓ Organisation tab signup form works
- ✓ Form stores `pending_org` in auth user metadata
- ✓ Sets `onboarding_intent` in user metadata
- ✓ If immediate session: redirects to `/onboarding/organisation`
- ✓ Onboarding page retrieves pending org data from metadata
- ✓ Organisation created automatically
- ✓ User assigned as owner
- ✓ Redirects to organisation page

**Database Validation**:
```sql
-- Verify user metadata contains pending org data
SELECT raw_user_meta_data FROM auth.users
WHERE email = 'testsignuporg+immediate@example.com';
-- Expected: Contains 'pending_org' and 'onboarding_intent' fields

-- Verify organisation created
SELECT name, verification_status FROM organisations
WHERE name = 'Test Signup Immediate Org';
-- Expected: verification_status = 'pending'
```

---

## Test 11: Signup with Organisation Tab (With Email Confirmation)

**Objective**: Verify signup flow with email confirmation defers org creation until auth callback

**Prerequisites**: Supabase configured for email confirmation (default case)

**Steps**:
1. Log out completely
2. Navigate to `/signup`
3. Click "Organisation" tab
4. Fill in organisation signup form:
   - Email: `testsignuporg+confirm@example.com`
   - Password: `SecurePass123!`
   - Organisation name: `Test Signup Confirm Org`
   - Country based: Select any country
   - What we do: `Testing signup with email confirmation flow.`
5. Click "Create account"
6. Verify message: "Please check your email to confirm your account"
7. Verify pending org data saved to localStorage (backup mechanism)
8. Check email inbox and click confirmation link
9. Verify redirect to `/auth/callback` then to `/onboarding/organisation`
10. Verify onboarding page:
    - Shows loading state "Setting up..." or "Creating your organisation..."
    - Retrieves pending org from user_metadata (primary) or localStorage (fallback)
    - Creates organisation via edge function
    - Redirects to organisation page
11. Verify organisation created and accessible

**Expected Result**:
- ✓ Signup with org tab stores pending data in user metadata
- ✓ Pending data also saved to localStorage as fallback
- ✓ Email confirmation required
- ✓ After confirmation: redirects to `/onboarding/organisation`
- ✓ Onboarding retrieves pending org from metadata
- ✓ Organisation created successfully
- ✓ User assigned as owner
- ✓ Entire flow completes without errors

**UI Validation**:
- Email confirmation message clear
- Loading states during org creation
- Smooth transitions between steps
- User understands what's happening at each stage

**Database Validation**:
```sql
-- Verify organisation created after confirmation
SELECT name, verification_status, created_by FROM organisations
WHERE name = 'Test Signup Confirm Org';
-- Expected: Created with correct data

-- Verify user metadata
SELECT raw_user_meta_data FROM auth.users
WHERE email = 'testsignuporg+confirm@example.com';
-- Expected: Contains pending_org data (may be cleared after org creation)
```

---

## Test 12: Onboarding Organisation Page - Missing Pending Data

**Objective**: Verify onboarding page redirects to manual create form when no pending data found

**Steps**:
1. Log in as authenticated user
2. Navigate directly to `/onboarding/organisation`
3. Ensure user has no `pending_org` in metadata or localStorage
4. Observe the result

**Expected Result**:
- ✓ Page checks for pending_org in user metadata
- ✓ Page checks for pending_org in localStorage (fallback)
- ✓ If neither found: redirects to `/organisations/create`
- ✓ User can manually enter organisation data
- ✓ No errors or infinite loading states

---

## Test 13: Onboarding Organisation Page - Already Has Owner Role

**Objective**: Verify onboarding page redirects to existing org if user already owns one

**Prerequisites**: User already has owner role in an organisation

**Steps**:
1. Log in as user with existing owner role
2. Navigate to `/onboarding/organisation`
3. Observe the result

**Expected Result**:
- ✓ Page checks if user already has owner role in any organisation
- ✓ If found: redirects to that organisation page
- ✓ Prevents duplicate organisation creation
- ✓ User sees their existing organisation

**Database Validation**:
```sql
-- Check if user already has owner role
SELECT organisation_id FROM organisation_members
WHERE user_id = auth.uid() AND role = 'owner';
-- Expected: Returns existing organisation_id
```

---

## Test 14: /profile Redirect - Personal Profile

**Objective**: Verify /profile redirects to personal profile page for individual users

**Steps**:
1. Log in as user without organisation kind or organisation_id in profile
2. Navigate to `/profile`
3. Observe the redirect

**Expected Result**:
- ✓ Page redirects to `/people/{user-id}`
- ✓ Personal profile page displays
- ✓ Profile shows user's information (name, bio, avatar, etc.)
- ✓ Redirect happens server-side

**Database Validation**:
```sql
-- Verify user profile type
SELECT id, kind, organisation_id FROM profiles
WHERE id = auth.uid();
-- Expected: kind != 'organisation' OR organisation_id IS NULL
```

---

## Test 15: /profile Redirect - Organisation Profile

**Objective**: Verify /profile redirects to organisation page when user kind is organisation

**Prerequisites**: User profile with `kind = 'organisation'` and `organisation_id` set

**Steps**:
1. Log in as user with organisation kind
2. Navigate to `/profile`
3. Observe the redirect

**Expected Result**:
- ✓ Page redirects to `/organisations/{organisation-id}`
- ✓ Organisation profile page displays
- ✓ Organisation information shown (not personal profile)
- ✓ Redirect based on profile kind and organisation_id

**Database Validation**:
```sql
-- Verify user profile is organisation type
SELECT kind, organisation_id FROM profiles
WHERE id = auth.uid();
-- Expected: kind = 'organisation' AND organisation_id IS NOT NULL
```

---

## Test 16: /profile Redirect - Unauthenticated

**Objective**: Verify /profile redirects to auth/login for unauthenticated users

**Steps**:
1. Log out completely
2. Navigate to `/profile`
3. Observe the redirect

**Expected Result**:
- ✓ Page redirects to `/auth` or login page
- ✓ User cannot access profile route without authentication
- ✓ After login, appropriate redirect occurs

---

## Test 17: Organisation Page - Public View (Non-Member)

**Objective**: Verify non-members can view verified organisation public profile but with limited actions

**Prerequisites**: At least one verified organisation exists

**Steps**:
1. Log in as user who is NOT a member of the target organisation
2. Navigate to verified organisation page: `/organisations/{org-id}`
3. Observe the page content and available actions

**Expected Result**:
- ✓ Page displays organisation public information:
  - Logo, name, verification badge
  - "On Solarpunk Taskforce since [date]"
  - "Based in [country]"
  - Overview section: What we do, Country, Established, Website
  - Social links (if provided)
  - Stats: Members count, Projects count, Followers count
  - Public updates (posts with visibility = "public")
- ✓ "Follow" button visible (if authenticated)
- ✓ Follow button shows current follower count
- ✗ NO "Edit" button visible
- ✗ NO "Members" button visible
- ✗ No admin/owner management options
- ✓ Non-member can follow/unfollow organisation
- ✓ No errors in browser console

**UI Validation**:
- Public information displayed clearly
- Follow functionality works
- No management options visible to non-members
- Page is read-only for non-members

---

## Test 18: Organisation Page - Member View (Non-Admin)

**Objective**: Verify organisation members see profile but without edit/management capabilities

**Prerequisites**: User with member role (not admin/owner) in an organisation

**Steps**:
1. Log in as user with member role in the organisation
2. Navigate to organisation page: `/organisations/{org-id}`
3. Observe available actions

**Expected Result**:
- ✓ Page displays full organisation information (same as public view)
- ✓ "Follow" button may still be visible
- ✗ NO "Edit" button visible (member cannot edit)
- ✗ NO "Members" button visible (member cannot manage members)
- ✓ Member sees same view as non-member/public
- ✓ Member status indicated somewhere (e.g., in header or badge)

**UI Validation**:
- Members see public profile without management options
- Being a member doesn't automatically grant edit permissions
- Role-based access control enforced

---

## Test 19: Organisation Page - Admin/Owner View

**Objective**: Verify admin/owner users see full management options on organisation page

**Prerequisites**: User with admin or owner role in an organisation

**Steps**:
1. Log in as user with admin or owner role
2. Navigate to organisation page: `/organisations/{org-id}`
3. Observe available actions and buttons

**Expected Result**:
- ✓ Page displays full organisation information
- ✓ "Edit" button visible → navigates to `/organisations/{org-id}/edit`
- ✓ "Members" button visible → navigates to `/organisations/{org-id}/members`
- ✓ Admin/owner can access management features
- ✓ All public information visible
- ✓ Stats and updates displayed

**UI Validation**:
- "Edit" and "Members" buttons prominently displayed
- Clear indication of admin/owner privileges
- Management options easily accessible

**Database Validation**:
```sql
-- Verify user's role
SELECT role FROM organisation_members
WHERE user_id = auth.uid() AND organisation_id = [org-id];
-- Expected: role = 'admin' OR role = 'owner'
```

---

## Test 20: Organisation Members Page - Non-Member Access

**Objective**: Verify non-members cannot access organisation members management page

**Prerequisites**: User NOT a member of the target organisation

**Steps**:
1. Log in as user who is not a member of the organisation
2. Navigate to `/organisations/{org-id}/members`
3. Observe the result

**Expected Result**:
- ✓ Access denied/restricted
- ✓ "Access Restricted" modal or page displayed
- ✓ Modal shows lock icon
- ✓ Message: "You don't have permission to manage members for this organisation. Only organisation admins and owners can access this page."
- ✓ "Back to organisation" link present
- ✗ No member data displayed
- ✗ No management interface visible
- ✓ RLS policies prevent data access

**UI Validation**:
- Clear access denied message
- User understands why access is restricted
- Easy navigation back to organisation page
- No data leakage

---

## Test 21: Organisation Members Page - Member Access (Non-Admin)

**Objective**: Verify regular members cannot access members management page

**Prerequisites**: User with member role (not admin/owner) in the organisation

**Steps**:
1. Log in as user with member role only
2. Navigate to `/organisations/{org-id}/members`
3. Observe the result

**Expected Result**:
- ✓ Access denied (same as non-member)
- ✓ "Access Restricted" modal displayed
- ✓ Message indicates only admins/owners can access
- ✗ No member management interface
- ✓ Regular members cannot manage other members

**UI Validation**:
- Access control enforced even for org members
- Clear distinction between member and admin/owner roles
- Helpful error message

---

## Test 22: Organisation Members Page - Admin/Owner Access

**Objective**: Verify admin/owner users can fully manage organisation members

**Prerequisites**: User with admin or owner role in the organisation

**Steps**:
1. Log in as user with admin or owner role
2. Navigate to `/organisations/{org-id}/members`
3. Observe the members management interface
4. Test member management actions:
   - View members table
   - Update a member's role (member ↔ admin)
   - Toggle permissions (can_create_projects, can_create_funding)
   - Attempt to remove a member (non-owner)
   - Attempt to remove the owner (should fail)

**Expected Result**:
- ✓ Full members page displays
- ✓ Members table shows:
  - User ID (or name/email if joined with profiles)
  - Role (owner, admin, member)
  - Can Create Projects (checkbox/toggle)
  - Can Create Funding (checkbox/toggle)
  - Actions (edit, remove)
- ✓ Can update member roles (except cannot demote owner)
- ✓ Can toggle permissions for members
- ✓ Can remove non-owner members
- ✗ Cannot remove owner
- ✗ Add member form may show error if not implemented
- ✓ Changes persist and update in database
- ✓ Real-time or refresh shows updated data

**UI Validation**:
- Members table clear and organized
- Role and permission controls easy to use
- Owner protection enforced (cannot be removed/demoted)
- Actions provide feedback (success/error messages)

**Database Validation**:
```sql
-- Verify member updates
SELECT user_id, role, can_create_projects, can_create_funding
FROM organisation_members
WHERE organisation_id = [org-id];
-- Expected: Changes reflected in database

-- Verify owner cannot be removed
SELECT COUNT(*) FROM organisation_members
WHERE organisation_id = [org-id] AND role = 'owner';
-- Expected: Always at least 1 owner
```

---

## Test 23: Public Directory - Verified Organisations Only

**Objective**: Verify public organisation directory displays only verified organisations

**Prerequisites**:
- At least one verified organisation exists
- At least one pending organisation exists

**Steps**:
1. Log out (test as unauthenticated user)
2. Navigate to `/find-organisations`
3. Observe the organisations displayed in:
   - Globe view (map markers)
   - Table view (list)
4. Switch between Globe and Table views
5. Apply filters:
   - Search by organisation name
   - Filter by country/region
   - Filter by thematic areas
6. Observe search results

**Expected Result**:
- ✓ Directory loads successfully
- ✓ Globe view shows markers for verified organisations
- ✓ Table view lists verified organisations
- ✓ Each organisation shows:
  - Name, Location (region, country)
  - Projects carried out, Ongoing projects
  - Followers count
  - Funding needed (USD)
  - Age (years)
  - "Open" button → navigates to org page
- ✓ All displayed organisations have verified status
- ✗ NO pending organisations visible
- ✗ NO rejected organisations visible
- ✓ Search and filters work correctly
- ✓ Results respect verification status

**UI Validation**:
- Directory shows comprehensive organisation data
- Map view displays correctly with geocoded locations
- Table view sortable and filterable
- No pending/rejected orgs leak into public view

**Database Validation**:
```sql
-- Verify directory view shows only verified
SELECT id, name, verification_status FROM organisations_directory_v1;
-- Note: Check if view filters by verification status or if UI applies filter

-- Verify pending orgs exist but hidden
SELECT COUNT(*) FROM organisations WHERE verification_status = 'pending';
-- Expected: > 0 (pending orgs exist in database)

-- Verify they don't appear in public queries
SELECT COUNT(*) FROM organisations_directory_v1
WHERE verification_status != 'verified';
-- Expected: 0 (if view filters) or UI should filter out non-verified
```

---

## Test 24: Signup Dropdown - Verified Organisations Only

**Objective**: Verify organisation dropdown in individual signup shows only verified organisations

**Prerequisites**:
- At least one verified organisation exists
- At least one pending organisation exists

**Steps**:
1. Log out completely
2. Navigate to `/signup`
3. Select "Individual" tab (should be default)
4. Scroll to "Organisation" dropdown field
5. Click the dropdown to open options
6. Observe the organisations listed

**Expected Result**:
- ✓ Dropdown shows "Independent / No organisation" option first
- ✓ Verified organisations appear in dropdown list
- ✗ Pending organisations do NOT appear
- ✗ Rejected organisations do NOT appear
- ✓ Dropdown loads from `verified_organisations` table/view
- ✓ Only verified orgs selectable for new user affiliation
- ✓ User can select verified org during signup

**UI Validation**:
- "Independent" option clearly visible and selectable
- Only verified orgs appear in list
- Dropdown loading/error states handled
- Selected org saved correctly during signup

**Database Validation**:
```sql
-- Verify verified_organisations view/table
SELECT id, name, verification_status FROM verified_organisations;
-- Expected: Only verification_status = 'verified'

-- Verify pending orgs excluded
SELECT name FROM organisations WHERE verification_status = 'pending';
-- These names should NOT appear in signup dropdown
```

---

## Test 25: Organisation Page - Pending Organisation (Creator View)

**Objective**: Verify organisation creator can view their pending organisation even though it's not public

**Prerequisites**: Pending organisation created by the logged-in user

**Steps**:
1. Log in as user who created the pending organisation
2. Navigate to pending organisation page: `/organisations/{pending-org-id}`
3. Observe the page content

**Expected Result**:
- ✓ Creator can access pending organisation page
- ✓ Page displays organisation information
- ✓ Verification status indicator shows "Pending" or "Awaiting Verification"
- ✓ Creator can see "Edit" and "Members" buttons (as owner)
- ✓ All entered data visible
- ✓ RLS allows creator to view own pending org
- ✓ Stats and information displayed (even if org not verified)

**UI Validation**:
- Clear pending status indicator
- Creator understands org is not yet public
- Full access to edit and manage pending org
- Pending badge/indicator prominent

**Database Validation**:
```sql
-- Verify creator can select own pending org
SELECT id, name, verification_status FROM organisations
WHERE created_by = auth.uid() AND verification_status = 'pending';
-- Expected: Returns the pending organisation
```

---

## Test 26: Organisation Page - Pending Organisation (Non-Creator View)

**Objective**: Verify non-creators cannot view pending organisations

**Prerequisites**:
- Pending organisation exists
- User is NOT the creator
- User is NOT an admin

**Steps**:
1. Log in as different user (not creator, not admin)
2. Navigate to pending organisation page: `/organisations/{pending-org-id}`
3. Observe the result

**Expected Result**:
- ✗ Access denied or 404 error
- ✗ Pending organisation data NOT displayed
- ✗ Non-creator cannot see pending org
- ✓ RLS policies block access
- ✓ No data leakage about pending organisation

**UI Validation**:
- Access denied message or 404 page
- No information about pending org revealed
- User cannot bypass RLS restrictions

---

## Test 27: Organisation Page - Pending Organisation (Public View)

**Objective**: Verify unauthenticated users cannot view pending organisations

**Prerequisites**: Pending organisation exists

**Steps**:
1. Log out completely
2. Navigate to pending organisation page: `/organisations/{pending-org-id}`
3. Observe the result

**Expected Result**:
- ✗ Access denied or 404 error
- ✗ Pending organisation NOT visible to public
- ✗ No organisation data displayed
- ✓ Public cannot discover or view pending orgs
- ✓ Directory does not include pending orgs
- ✓ Direct URL access blocked

**Security Validation**:
- Pending orgs completely hidden from public
- No data leakage via direct URL access
- RLS policies enforced correctly

---

## Test 28: Admin User - View All Organisations

**Objective**: Verify admin users can view all organisations regardless of verification status

**Prerequisites**: User account with admin or superadmin privileges

**Steps**:
1. Log in as admin user
2. Navigate to admin panel or organisation directory
3. Navigate to pending organisation: `/organisations/{pending-org-id}`
4. Navigate to verified organisation
5. Navigate to rejected organisation (if any exist)

**Expected Result**:
- ✓ Admin can access all organisations
- ✓ Admin can view pending organisations
- ✓ Admin can view verified organisations
- ✓ Admin can view rejected organisations
- ✓ Admin can see verification status for all orgs
- ✓ RLS allows admin bypass for viewing

**Database Validation**:
```sql
-- As admin, select all organisations
SELECT id, name, verification_status FROM organisations;
-- Expected: All organisations regardless of status (if user is_admin())
```

---

## Test Results Template

Use this template to record test execution results:

```
Test #: [Number and Name]
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Local/Staging/Production]
Browser: [Chrome/Firefox/Safari/etc.]
Result: [PASS/FAIL/PARTIAL]

Steps Completed:
- [x] Step 1
- [x] Step 2
- [ ] Step 3 (failed)

Issues Found:
- [Description of any bugs or unexpected behavior]

Screenshots/Evidence:
- [Links or attachments]

Notes:
- [Additional observations]
```

---

## Troubleshooting

### Common Issues

**User menu not showing organisation links**:
- Verify user has organisation membership in `organisation_members` table
- Check user's role in the organisation
- Verify `canManageOrg` logic (admin or owner role required for edit/members links)
- Clear browser cache and reload
- Check browser console for errors

**/me/organisations page empty when user has orgs**:
- Verify `organisation_members` records exist for user
- Check if JOIN with `organisations` table succeeds
- Verify RLS policies allow user to read their memberships
- Check database connection and query execution
- Review browser console for API errors

**Create organisation fails**:
- Verify user is authenticated
- Check all required fields filled (name, country_based, what_we_do)
- Verify edge function `create-organisation` is deployed and accessible
- Check Supabase connection
- Review RLS policies on organisations table (must allow INSERT for authenticated users)
- Check browser console for error details

**Onboarding page stuck on loading**:
- Verify `pending_org` data exists in user metadata or localStorage
- Check edge function response time and errors
- Verify redirect logic works correctly
- Clear browser cache and localStorage
- Check if user already has owner role (should redirect to existing org)
- Review browser console for errors

**Profile redirect not working**:
- Verify redirect is server-side (check for server component in `/app/profile/page.tsx`)
- Check user's `kind` and `organisation_id` in profiles table
- Verify redirect logic: org kind → org page, otherwise → people page
- Test with different user profile types
- Check authentication status

**Non-members can access members page**:
- **SECURITY ISSUE**: Check access control logic immediately
- Verify `canManageOrg` check in members page component
- Review RLS policies on `organisation_members` table
- Ensure UI blocks non-admin/owner users
- Test with different roles (member, non-member, admin, owner)

**Pending organisation visible in public directory**:
- **SECURITY ISSUE**: Check RLS and filtering immediately
- Verify `organisations_directory_v1` view filters correctly
- Check if UI applies verification status filter
- Verify RLS policies on organisations table
- Test directory as logged out user
- Search for pending org name to ensure it's hidden

**Verified badge not appearing**:
- Verify `verification_status = 'verified'` in database
- Check component logic for badge rendering
- Verify organisation data fetched includes verification_status
- Clear cache and reload
- Check UI component rendering logic

**Admin cannot view pending organisations**:
- Verify user has admin privileges (`is_admin()` returns true)
- Check RLS policies allow admin bypass
- Verify admin function defined and working
- Test with different admin levels (admin vs superadmin)
- Review database permissions

---

## Related Documentation

- See `organisation-signup.md` for organisation signup and RLS testing
- See `../smoke-tests.md` for Phase 1 and Phase 2 feature testing
- See `../rls-matrix.md` for complete RLS policy matrix
- See `../phase1-ui-checklist.md` for UI component verification
- See `/README.md` for local development setup

---

## Security Reminders

🔒 **Critical**: Pending and rejected organisations MUST NOT be visible to public or non-creator users. Any failure of this test is a **security vulnerability** and must be fixed immediately.

🔒 **Critical**: Non-members and regular members must NOT access organisation members management page. Only admin/owner roles should have access.

🔒 **Critical**: Menu links for "Edit organisation" and "Members" should only appear for users with admin or owner roles. Regular members should not see these options.

🔒 **Critical**: Public directory and signup dropdown must show only verified organisations. Test thoroughly to prevent pending/rejected org leakage.

🔒 **Critical**: RLS policies must enforce all access controls. UI restrictions alone are insufficient—database-level security is required.
