# PWA Hybrid Offline Architecture Implementation

Date: 2026-06-09

## Purpose

Emergency OS now uses a hybrid PWA offline architecture:

```txt
Normal routes
  -> remain the full online application
  -> show a shared offline connectivity banner
  -> do not contain duplicated offline page implementations

/offline
  -> standalone offline-first emergency hub
  -> receives failed navigation requests through the service worker fallback
  -> reads the last public emergency snapshot cached on the device
```

This avoids creating duplicated routes such as:

```txt
/offline/map
/offline/alerts
/offline/sos
/offline/profile
```

Duplicating those routes would require every future feature and bug fix to be
implemented twice. The hybrid design keeps one online application and one
focused offline fallback surface.

## Implemented Scope

Implemented:

```txt
/offline standalone emergency hub
global connectivity banner
public-only EmergencyDataSnapshot cache
IndexedDB persistence
failed navigation fallback to /offline
minimal runtime caching
explicit network-only rules for sensitive/API traffic
manifest metadata improvements
```

Intentionally omitted:

```txt
personal saved-location caching
emergency contact caching
phone number caching
SOS request/message caching
notification history caching
offline map tiles
offline route calculation
push notifications
background sync
automatic SOS delivery
custom install prompt
production-quality PNG PWA icons
```

## Privacy Boundary

The offline snapshot contract is defined in:

```txt
types/pwa.ts
```

It allows only:

```txt
cached timestamp
live mode marker
public shelter records
public weather alerts
public data source status
```

It deliberately excludes:

```txt
saved locations
exact personal coordinates
profiles
contacts
phone numbers
notifications
SOS requests
SOS messages
```

The service worker also treats Supabase and government API traffic as
`NetworkOnly`. This prevents the generic service worker cache from silently
retaining authenticated responses.

## Data Flow

### Online Snapshot Capture

```txt
app/page.tsx
  -> getEmergencyData({ mode })
  -> construct PublicEmergencySnapshot
  -> PublicEmergencySnapshotCache
  -> cachePublicEmergencySnapshot()
  -> IndexedDB
```

The client cache writer only saves a snapshot while the browser reports that it
is online.

### Offline Navigation

```txt
user navigates while offline
  -> service worker attempts NetworkOnly navigation
  -> navigation fails
  -> Workbox document fallback
  -> /offline
```

### Offline Snapshot Display

```txt
/offline
  -> OfflineEmergencyHub
  -> readPublicEmergencySnapshot()
  -> IndexedDB
  -> cached shelter and weather alert lists
```

All cached information is visibly described as stale and not live.

## File Responsibilities

### `types/pwa.ts`

Defines `PublicEmergencySnapshot`, the security/privacy boundary for offline
data.

### `lib/pwa/emergency-snapshot-cache.ts`

Small IndexedDB adapter responsible for:

```txt
opening the Emergency OS offline database
creating the public snapshot object store
writing the latest public snapshot
reading the latest public snapshot
```

No React or Supabase code exists in this module.

### `lib/pwa/network-status.ts`

Exposes a browser network-status external store used with React
`useSyncExternalStore`.

This avoids duplicating `online` and `offline` event listeners across
components.

### `components/pwa/PublicEmergencySnapshotCache.tsx`

Invisible client component that receives an already-sanitized public snapshot
from the server-rendered homepage and writes it to IndexedDB.

### `components/pwa/OfflineBanner.tsx`

Global shared connectivity warning rendered from `app/layout.tsx`.

It links directly to `/offline` when the browser reports no network access.

### `components/pwa/OfflineEmergencyHub.tsx`

Standalone offline UI. It displays:

```txt
connection state
stale-data warning
last cache timestamp
cached shelter count/list
cached weather alert count/list
data source count
known offline limitations
```

### `app/offline/page.tsx`

Dedicated route for the offline hub and service-worker document fallback.

### `next.config.ts`

Defines PWA/service-worker behavior:

```txt
do not cache dynamic start URL
do not automatically reload when connection returns
fallback failed documents to /offline
do not precache large map/weather assets
cache selected public static assets after first use
never cache Supabase/government API responses
never cache OpenFreeMap tiles
```

### `public/manifest.json`

Adds:

```txt
app id
PWA start URL
scope
orientation
language
categories
light theme/background colors
```

## Runtime Caching Policy

### Navigation Requests

```txt
NetworkOnly
```

Reason:

```txt
standard pages can contain authenticated/personalized content
the app should not silently serve an old authenticated page
failed requests use /offline instead
```

### Public GeoJSON Boundaries

```txt
CacheFirst after first use
maximum 3 entries
30 day expiry
```

### Weather Icons

```txt
CacheFirst after first use
maximum 80 entries
30 day expiry
```

### Supabase and Government APIs

```txt
NetworkOnly
```

Public emergency data is cached explicitly through the typed IndexedDB
snapshot. This is easier to audit than caching arbitrary API responses.

### Map Tiles

```txt
NetworkOnly
```

Offline maps are not part of the current scope. The offline hub provides
list-based shelter information instead.

## User Experience

### Online

The standard application behaves normally. Visiting the main overview updates
the public offline snapshot.

### Connection Lost While App Is Open

A shared warning appears:

```txt
You are offline. Live emergency information may be unavailable.
```

The warning links to `/offline`.

### Navigation While Offline

The service worker falls back to `/offline` when a standard page cannot be
loaded.

### No Cached Snapshot

The offline hub explains that the user must visit the overview once while
online before a public emergency snapshot is available.

## Known Limitations

### Service Worker Is Disabled in Development

`next.config.ts` disables PWA generation in development. Offline fallback must
be verified through a production build:

```txt
npm run build
npm run start
```

### Production Builds Must Use Webpack

`@ducanh2912/next-pwa` generates the service worker through Next.js' Webpack
integration. Next.js 16 defaults production builds to Turbopack, which can
finish successfully without emitting a service worker.

The `package.json` build script therefore runs:

```txt
next build --webpack
```

Do not remove `--webpack` while this PWA plugin is in use. After every
production build, confirm that `public/sw.js` and `public/workbox-*.js` exist.

Those files, along with `public/fallback-*.js`, are generated build artifacts
and are intentionally excluded by `.gitignore`. They must not be reviewed or
rolled back as source files.

### HTTPS Is Required

Deployed PWA/service-worker behavior requires HTTPS. `localhost` is the normal
development exception.

### Current Manifest Icon Is Not Production Quality

The manifest still uses the existing favicon. A later refinement should add:

```txt
192x192 PNG
512x512 PNG
maskable PNG icons
apple-touch-icon
```

### Cached Data Updates Only Through the Overview

The public snapshot is currently refreshed when the main overview page renders
online. This keeps the implementation explicit and small.

Future versions can add the cache writer to other trusted public-data pages.

### Browser Connectivity Is an Approximation

`navigator.onLine` reports network interface availability, not guaranteed
internet/API reachability. The service-worker navigation fallback remains the
authoritative failure path.

## Files Added

```txt
app/offline/page.tsx
components/pwa/OfflineBanner.tsx
components/pwa/OfflineEmergencyHub.tsx
components/pwa/PublicEmergencySnapshotCache.tsx
lib/pwa/emergency-snapshot-cache.ts
lib/pwa/network-status.ts
types/pwa.ts
temp/pwa-offline-hybrid-implementation.md
```

## Files Modified

```txt
app/layout.tsx
app/page.tsx
.gitignore
next.config.ts
package.json
public/manifest.json
```

## Rollback

This implementation does not change the database or require a migration.

To roll back the code, revert only the files listed under `Files Added` and
`Files Modified`.

Recommended Git approach:

```txt
use a normal revert commit after this change is committed
or restore only the listed paths before it is committed
```

Do not use a broad hard reset when unrelated work exists in the worktree.

### Clear Existing Browser PWA Data After Rollback

If the PWA has already been tested or installed:

```txt
Chrome DevTools
  -> Application
  -> Service Workers
  -> Unregister

Chrome DevTools
  -> Application
  -> Storage
  -> Clear site data
```

This removes:

```txt
generated service worker caches
Emergency OS IndexedDB public snapshot
installed-site test state
```

## Production Verification Checklist

Run:

```txt
npm run build
npm run start
```

Verify:

```txt
/offline renders
public/sw.js and public/workbox-*.js exist after npm run build
service worker registers
/offline is present in precache/fallback behavior
overview visit creates emergency-os-offline IndexedDB
cached snapshot contains no personal data
offline navigation falls back to /offline
offline hub displays cached public records
Supabase responses are not stored in Cache Storage
map tiles are not stored in Cache Storage
connection banner appears when browser goes offline
```

## Recommended Next Refinements

Not part of this implementation:

```txt
add proper PWA icon set
add install prompt on the PWA readiness page
add a public snapshot freshness policy
add cache schema migration/versioning if the snapshot contract changes
add automated browser tests for offline fallback
consider an opt-in policy before caching any personal data
```
