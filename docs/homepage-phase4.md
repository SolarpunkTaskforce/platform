# Home page upgrade: Phase 1–4 notes

## Phase overview

- **Phase 1 – Globe foundation**
  - Base Mapbox globe with navigation controls and Mapbox token fallback.
  - Approved project markers and popup CTA wiring.
- **Phase 2 – Mode switching + datasets**
  - Globe supports Projects / Funding / Issues modes with distinct marker datasets.
  - Autopilot highlights featured items as they rotate into view.
- **Phase 3 – Stats + content polish**
  - Dual stats panels for each mode (mobile snapshot on small screens).
  - About + Services sections added below the globe.
- **Phase 4 – Production hardening + polish**
  - Public-only aggregates for home stats.
  - Explicit caching for stats, reduced-motion compliance, debug flag, and error fallbacks.
  - Popup rate limiting + user-interaction cooldown.

## QA checklist

### Interaction
- **Desktop hover:** hover the top mode chips; the globe and stats should switch modes smoothly.
- **Click navigation:** use the CTA buttons (desktop and mobile) to open the correct route.
- **Mobile behavior:** use the segmented control to swap modes; ensure stats stack cleanly.

### Reduced motion
- Enable OS-level "Reduce Motion" and confirm:
  - Globe auto-rotation stops.
  - Autopopups stop.
  - Mode/stat transitions are not animated.

### Stats correctness
- Verify aggregates only include approved/published/visible rows:
  - Projects: `status = approved` + `visibility in (public, unlisted)`.
  - Grants: `is_published = true` and `status in (open, rolling)`.
  - Watchdog: `status = approved`, urgency ≥ 4 for high urgency.

### Caching behavior
- `/api/home-stats` should return `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600`.
- Server fetch should use `revalidate: 600` and force cache in Next.

## Debug mode

Append `?globeDebug=1` to the home page URL to display:
- Current mode
- Featured item ID
- In-view threshold

## Configuration knobs

Update in `src/components/home/HomeGlobe.tsx`:
- `ROTATION_SPEED_DEG_PER_SEC`
- `MIN_SWITCH_MS`
- `POPUP_CHECK_INTERVAL_MS`
- `INTERACTION_COOLDOWN_MS`
- `RECENT_POOL_SIZE`
- `IN_VIEW_THRESHOLD`

## Out of scope (explicit)
- New product features, pages, or sections.
- Database schema redesigns.
- Migrations unless required for correctness/safety.
