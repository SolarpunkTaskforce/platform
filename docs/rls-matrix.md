# RLS Test Matrix

This document outlines the Row Level Security (RLS) policy test matrix for Phase 2 integration. Each table lists expected access patterns for different user roles.

## Test Roles

- **Logged out**: Unauthenticated visitor
- **Logged in**: Authenticated user (not owner/admin)
- **Owner**: Resource creator or owner
- **Admin**: Platform administrator

## Tables and Expected Policies

### 1. project_updates

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT (public) | ✓ Read public updates | ✓ Read public updates | ✓ Read all own updates | ✓ Read all updates |
| SELECT (project) | ✗ Denied | TBD | TBD | ✓ Read all updates |
| INSERT | ✗ Denied | ✗ Denied | ✓ Create for own projects | ✓ Create for any project |
| UPDATE | ✗ Denied | ✗ Denied | ✓ Update own updates | ✓ Update any update |
| DELETE | ✗ Denied | ✗ Denied | ✓ Delete own updates | ✓ Delete any update |

### 2. follow_edges

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | TBD | ✓ Read all follows | ✓ Read all follows | ✓ Read all follows |
| INSERT | ✗ Denied | ✓ Create own follows | ✓ Create own follows | ✓ Create any follow |
| UPDATE | ✗ Denied | ✗ Denied | ✗ Denied | TBD |
| DELETE | ✗ Denied | ✓ Delete own follows | ✓ Delete own follows | ✓ Delete any follow |

### 3. update_likes (Planned - Phase 2)

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | TBD | TBD | TBD | TBD |
| INSERT | ✗ Denied | TBD | TBD | TBD |
| UPDATE | ✗ Denied | TBD | TBD | TBD |
| DELETE | ✗ Denied | TBD | TBD | TBD |

### 4. update_comments (Planned - Phase 2)

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | TBD | TBD | TBD | TBD |
| INSERT | ✗ Denied | TBD | TBD | TBD |
| UPDATE | ✗ Denied | TBD | TBD | TBD |
| DELETE | ✗ Denied | TBD | TBD | TBD |

### 5. funding_opportunities

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | TBD | TBD | TBD | TBD |
| INSERT | ✗ Denied | TBD | TBD | TBD |
| UPDATE | ✗ Denied | TBD | TBD | TBD |
| DELETE | ✗ Denied | TBD | TBD | TBD |

### 6. watchdog_issues (Planned)

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | TBD | TBD | TBD | TBD |
| INSERT | ✗ Denied | TBD | TBD | TBD |
| UPDATE | ✗ Denied | TBD | TBD | TBD |
| DELETE | ✗ Denied | TBD | TBD | TBD |

### 7. moderation_events (Planned)

| Operation | Logged out | Logged in | Owner | Admin |
|-----------|-----------|-----------|-------|-------|
| SELECT | ✗ Denied | ✗ Denied | TBD | TBD |
| INSERT | ✗ Denied | ✗ Denied | ✗ Denied | TBD |
| UPDATE | ✗ Denied | ✗ Denied | ✗ Denied | TBD |
| DELETE | ✗ Denied | ✗ Denied | ✗ Denied | TBD |

## Testing Notes

- TBD indicates policies that need to be defined during Phase 2 implementation
- ✓ indicates expected access granted
- ✗ indicates expected access denied
- All policies must be validated with automated tests before deployment
- Reference `/scripts/rls-smoke.ts` for testing patterns

## Related Documentation

- See `smoke-tests.md` for manual verification procedures
- See `phase1-ui-checklist.md` for UI component verification
