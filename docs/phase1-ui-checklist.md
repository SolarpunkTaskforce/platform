# Phase 1 UI Quality Assurance Checklist

This checklist verifies that Phase 1 UI components are functioning correctly before Phase 2 integration.

## Feed Page (`/feed`)

### Tab System

- [ ] **Four tabs visible**
  - [ ] "For you" tab displays for logged-in users
  - [ ] "Global" tab displays for all users
  - [ ] Additional tabs render if implemented (Watchdog, etc.)
  - [ ] Tabs are styled consistently with design system

- [ ] **URL parameter behavior**
  - [ ] Clicking "Global" tab updates URL to `?tab=global`
  - [ ] Clicking "For you" tab updates URL to `?tab=for_you`
  - [ ] Direct navigation to `?tab=global` activates correct tab
  - [ ] Direct navigation to `?tab=for_you` activates correct tab
  - [ ] Invalid tab parameter defaults to appropriate tab
  - [ ] Browser back/forward buttons work with tab state

- [ ] **Tab content switching**
  - [ ] Switching tabs updates feed content immediately
  - [ ] No layout shift occurs during tab switching
  - [ ] Loading states display appropriately during content fetch
  - [ ] Previous tab content clears when switching

### Empty States

- [ ] **Global tab - no content**
  - [ ] Empty state message displays when no global updates exist
  - [ ] Empty state includes clear, friendly messaging
  - [ ] Empty state suggests next actions (if applicable)
  - [ ] No errors in browser console

- [ ] **For you tab - not following anyone**
  - [ ] Empty state displays when user follows no entities
  - [ ] Message explains user needs to follow projects/organisations
  - [ ] Links or suggestions to discover content present
  - [ ] No errors in browser console

- [ ] **For you tab - following but no updates**
  - [ ] Empty state distinguishes between "no follows" and "no updates from follows"
  - [ ] Message is clear and helpful
  - [ ] No errors in browser console

### Feed Content Display

- [ ] **Update cards render correctly**
  - [ ] Project name displays with link
  - [ ] Update title displays
  - [ ] Update body/preview text displays
  - [ ] Timestamp shows in readable format
  - [ ] Author information displays (if applicable)
  - [ ] Cards have consistent spacing and alignment

- [ ] **Pagination/Loading**
  - [ ] Initial feed load shows updates
  - [ ] Scroll-based loading or "Load more" button works
  - [ ] Loading indicators appear during fetch
  - [ ] No duplicate updates appear
  - [ ] End of feed indicated clearly

### Discover Sections

- [ ] **Discover People section**
  - [ ] Section heading displays
  - [ ] User cards render with avatars and names
  - [ ] Follow buttons functional
  - [ ] Links to user profiles work

- [ ] **Discover Organisations section**
  - [ ] Section heading displays
  - [ ] Organisation cards render correctly
  - [ ] Follow buttons functional
  - [ ] Links to organisation pages work

- [ ] **Discover Projects section**
  - [ ] Section heading displays
  - [ ] Project cards render correctly
  - [ ] Follow buttons functional
  - [ ] Links to project pages work

## Entity Pages - Updates Section

### Project Pages (`/projects/[slug]`)

- [ ] **Updates section presence**
  - [ ] "Updates" section heading visible
  - [ ] Section positioned appropriately on page
  - [ ] Section styling consistent with page design

- [ ] **Updates display**
  - [ ] Project updates list in reverse chronological order
  - [ ] Each update shows title, content preview, and timestamp
  - [ ] Empty state displays if no updates exist
  - [ ] Public updates visible to logged-out users
  - [ ] Private updates hidden from non-members

- [ ] **"New update" button behavior**
  - [ ] Button visible only to project owners/editors
  - [ ] Button hidden for non-owners
  - [ ] Button hidden for logged-out users
  - [ ] Clicking button opens update creation form (Phase 2)
  - [ ] Button styled consistently

### Organisation Pages (`/organisations/[slug]`)

- [ ] **Updates section presence**
  - [ ] Updates or posts section heading visible
  - [ ] Section positioned appropriately
  - [ ] Section styling matches design

- [ ] **Updates display**
  - [ ] Organisation posts/updates display correctly
  - [ ] Content shows in reverse chronological order
  - [ ] Empty state if no content exists
  - [ ] Visibility rules enforced correctly

- [ ] **Content creation button**
  - [ ] "New post" or equivalent button visible to organisation admins
  - [ ] Button hidden for non-admins
  - [ ] Button behaves correctly when clicked

### Watchdog Issue Pages (if implemented)

- [ ] **Updates section presence**
  - [ ] Section visible on watchdog issue pages
  - [ ] Styling consistent with other entity pages

- [ ] **Updates display**
  - [ ] Issue updates display correctly
  - [ ] Empty state present if no updates
  - [ ] Visibility and permissions correct

## Social Components

### Follow Button Component

- [ ] **Button states**
  - [ ] "Follow" state displays for unfollowed entities
  - [ ] "Following" state displays for followed entities
  - [ ] Hover states work correctly
  - [ ] Loading/disabled state during API call

- [ ] **Button functionality**
  - [ ] Clicking toggles follow status
  - [ ] Optimistic UI updates immediately
  - [ ] Changes persist after page refresh
  - [ ] Error states handle gracefully

- [ ] **Button visibility**
  - [ ] Hidden when logged out
  - [ ] Shows login prompt when logged-out user attempts interaction
  - [ ] Visible for logged-in users
  - [ ] User cannot follow themselves

### Update Cards (in feed)

- [ ] **Card layout**
  - [ ] Cards have consistent width and padding
  - [ ] Card borders/shadows render correctly
  - [ ] Responsive design works on mobile/tablet/desktop

- [ ] **Card content**
  - [ ] All fields display correctly (title, body, author, timestamp)
  - [ ] Images/media render if present
  - [ ] Links are clickable and navigate correctly
  - [ ] Text truncation works for long content

- [ ] **Card interactions**
  - [ ] Clicking card navigates to update detail (if applicable)
  - [ ] Like button displays (Phase 2)
  - [ ] Comment count displays (Phase 2)

### Navigation Integration

- [ ] **Feed link in navigation**
  - [ ] "Feed" link present in main navigation
  - [ ] Link navigates to `/feed`
  - [ ] Active state shows when on feed page

- [ ] **Responsive navigation**
  - [ ] Feed link accessible on mobile menu
  - [ ] No layout issues on different screen sizes

## Accessibility

- [ ] **Keyboard navigation**
  - [ ] Tabs navigable with keyboard
  - [ ] Follow buttons keyboard-accessible
  - [ ] All interactive elements have focus states

- [ ] **Screen reader support**
  - [ ] Tabs have appropriate ARIA labels
  - [ ] Empty states have meaningful text
  - [ ] Button states announced correctly

- [ ] **Color contrast**
  - [ ] Text meets WCAG AA contrast requirements
  - [ ] Tab indicators visible
  - [ ] Button states distinguishable

## Performance

- [ ] **Page load times**
  - [ ] Feed page loads in under 3 seconds
  - [ ] No blocking JavaScript delays initial render
  - [ ] Images lazy-load appropriately

- [ ] **Rendering**
  - [ ] No layout shift during content load
  - [ ] Smooth transitions between tabs
  - [ ] No janky scrolling

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Error Handling

- [ ] **Network errors**
  - [ ] Graceful error messages when API fails
  - [ ] Retry mechanisms work
  - [ ] Offline state handled

- [ ] **Permission errors**
  - [ ] Clear messaging when user lacks permissions
  - [ ] No console errors for expected permission denials
  - [ ] Appropriate UI state for restricted content

## Verification Sign-Off

Use this section to track verification:

```
Verified by: _______________
Date: _______________
Environment: [ ] Local [ ] Staging [ ] Production
Browser(s): _______________
Overall Status: [ ] PASS [ ] FAIL [ ] PARTIAL

Notes:
_________________________________
_________________________________
```

## Notes

- This checklist covers **Phase 1 only** - no update creation, likes, or comments
- All items should pass before proceeding with Phase 2 integration
- Any failures should be documented and resolved
- Phase 2 features are marked clearly in smoke-tests.md

## Related Documentation

- See `smoke-tests.md` for step-by-step testing procedures
- See `rls-matrix.md` for security policy verification
