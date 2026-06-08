# Emergency OS PWA Readiness Analysis and Deployment Plan

Date: 2026-06-08

## Purpose

Emergency OS is intended to become a Progressive Web App (PWA). This document
captures the current project state, what is required for a successful PWA
deployment, what can be omitted, and how to think about offline behavior for an
emergency-focused app.

The key principle:

```txt
Installability is not enough.
Emergency OS must handle offline and stale data safely.
```

For an emergency app, offline data must be useful, clearly labeled, and never
presented as live.

## Current PWA State

The project is already partially PWA-ready.

Existing pieces:

```txt
@ducanh2912/next-pwa
next.config.ts PWA wrapper
public/manifest.json
app/layout.tsx manifest metadata
app/test-ui/pwa/page.tsx prototype readiness page
```

Relevant files:

```txt
next.config.ts
app/layout.tsx
public/manifest.json
app/test-ui/pwa/page.tsx
package.json
```

Current `next.config.ts` uses:

```ts
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});
```

This is a good starting point, but it is still generic. It does not yet define
Emergency OS-specific offline behavior.

## Current Gaps

### 1. Manifest Is Too Minimal

Current manifest has only:

```txt
name
short_name
description
start_url
display
background_color
theme_color
favicon.ico icon
```

This may not be enough for reliable PWA installability.

Recommended additions:

```json
{
  "scope": "/",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "orientation": "portrait-primary",
  "categories": ["public-safety", "utilities"],
  "lang": "en-MY"
}
```

Recommended icon assets:

```txt
192x192 PNG
512x512 PNG
maskable 192x192 PNG
maskable 512x512 PNG
apple-touch-icon PNG
```

### 2. Service Worker Strategy Is Too Generic

The PWA plugin can generate/register a service worker, but the current config
does not define what should be cached for this specific app.

Emergency OS needs caching rules for:

```txt
app shell
static assets
map geojson files
weather icons
offline page
safe emergency snapshot data
```

Potentially cached static files:

```txt
public/malaysia-states.geojson
public/MY-box.geojson
public/weather-icons/*
public/manifest.json
public/icons/*
```

### 3. No Offline Emergency Snapshot Strategy

The app depends on live Supabase and government data. A useful PWA should still
show the last known emergency state when offline.

Recommended behavior:

```txt
If online:
  load latest EmergencyDataSnapshot
  store a safe copy locally

If offline:
  read last cached EmergencyDataSnapshot
  show it with a strong stale/offline warning
```

Data that is useful offline:

```txt
latest shelters
latest weather alerts
saved locations
emergency contacts
recent notifications
latest data source status
simulation scenario data
```

Privacy-sensitive data that needs policy approval before caching:

```txt
phone numbers
SOS messages
exact user coordinates
emergency contacts
personal notification history
```

### 4. No Dedicated Offline Page

The app should have:

```txt
app/offline/page.tsx
```

The offline page should say:

```txt
You are offline.
Some information may be unavailable.
Any displayed emergency data may be stale.
Verify critical instructions with official agencies.
SOS delivery through WhatsApp may require internet access.
```

### 5. Map Offline Support Is Hard

The map uses online map tiles. Even if the app shell works offline, the map may
not fully render without network access.

Possible strategies:

```txt
Phase 1:
  Do not promise offline maps.
  Show cached shelter and saved-location lists when offline.

Phase 2:
  Cache recently viewed map tiles.

Phase 3:
  Add a dedicated offline tile source.
```

For this project, Phase 1 is the most practical and conceptually clear.

### 6. SOS Offline Behavior Must Be Honest

Current SOS uses WhatsApp deep links. A deep link can prepare a message, but
actual delivery still depends on WhatsApp and network availability.

Offline SOS should not claim automatic sending.

Safe offline SOS behavior:

```txt
show emergency contacts
show/copy prepared SOS message
show coordinates if geolocation works
allow local draft storage
warn that message delivery requires connectivity
```

### 7. Install UX Is Missing

The app may become installable in production, but the UI does not currently help
the user understand installation.

Optional component:

```txt
components/pwa/InstallPrompt.tsx
```

Possible locations:

```txt
profile page
PWA readiness page
navbar menu
settings/admin page
```

### 8. Production Verification Is Required

The PWA plugin disables service worker generation in development:

```txt
disable: process.env.NODE_ENV === "development"
```

PWA behavior must be tested with:

```txt
npm run build
npm run start
```

Installability should also be tested on a deployed HTTPS URL.

## Recommended PWA Concept

Emergency OS should be an offline-capable emergency information app, not a fully
offline emergency dispatch system.

Recommended concept:

```txt
Online:
  live/simulation emergency data
  maps
  shelter navigation
  weather forecasts
  profile and saved locations
  SOS WhatsApp deep link

Offline:
  app shell loads
  offline page works
  last cached emergency snapshot is visible
  saved locations are visible
  emergency contacts are visible if policy allows caching
  SOS message can be copied/prepared
  map degrades to list-based fallback
```

## Implementation Plan

### Phase 1: Installable PWA Foundation

Goal:

```txt
Make the app installable and pass basic PWA checks.
```

Tasks:

```txt
generate proper PWA icons
update public/manifest.json
confirm app/layout.tsx metadata
confirm service worker generation in production
add basic /offline route
```

Files likely touched:

```txt
public/manifest.json
public/icons/*
app/layout.tsx
app/offline/page.tsx
next.config.ts
```

Can be omitted:

```txt
custom install prompt
advanced runtime caching
offline emergency snapshot
offline SOS drafts
```

### Phase 2: Offline App Shell and Static Assets

Goal:

```txt
Make the app shell, offline page, and static emergency assets available offline.
```

Tasks:

```txt
configure service worker runtime caching
cache static assets
cache weather icons
cache geojson boundaries
show offline banner
route failed navigations to /offline
```

Files likely touched:

```txt
next.config.ts
components/pwa/OfflineBanner.tsx
app/layout.tsx
app/offline/page.tsx
```

Can be omitted:

```txt
map tile caching
push notifications
background sync
```

### Phase 3: Emergency Snapshot Cache

Goal:

```txt
Show last known emergency data when offline.
```

Tasks:

```txt
create emergency snapshot cache helper
store latest EmergencyDataSnapshot when online
read cached snapshot when offline
display stale-data timestamp
label cached mode clearly
avoid caching sensitive fields unless approved
```

Suggested files:

```txt
lib/pwa/cache-emergency-snapshot.ts
lib/pwa/offline-status.ts
components/pwa/OfflineBanner.tsx
components/pwa/StaleDataNotice.tsx
```

Storage choice:

```txt
IndexedDB for structured snapshots
localStorage only for small metadata
```

Can be omitted:

```txt
cached SOS request history
cached emergency contacts
cached phone numbers
```

### Phase 4: Offline Map Fallback

Goal:

```txt
Keep map-related information useful even when map tiles are unavailable.
```

Recommended first implementation:

```txt
If offline:
  show cached shelter list
  show cached saved-location list
  show coordinates and directions links if available
  show clear warning that map tiles may not load
```

Can be omitted:

```txt
offline tile packs
pre-caching entire Malaysia map
offline route calculation
```

### Phase 5: SOS Offline Fallback

Goal:

```txt
Let the user prepare emergency information offline without pretending delivery happened.
```

Recommended behavior:

```txt
show last known emergency contacts if caching is allowed
compose SOS message locally
copy message to clipboard
store local draft
show delivery warning
```

Can be omitted:

```txt
automatic WhatsApp sending
SMS provider integration
background sync queue
```

### Phase 6: Install Prompt and PWA UX

Goal:

```txt
Make installability understandable to users.
```

Tasks:

```txt
add InstallPrompt component
detect beforeinstallprompt
detect standalone mode
avoid repeated prompts
add simple install section on PWA page/profile
```

Can be omitted:

```txt
custom onboarding flow
platform-specific install tutorials
```

## What Can Be Omitted for an FYP/Refinement Deployment

Reasonable omissions:

```txt
push notifications
background sync
offline map tiles
offline route calculation
automatic WhatsApp sending
SMS provider integration
advanced install onboarding
report PDF offline generation
cached admin pages
```

Recommended must-haves:

```txt
proper manifest
proper icons
registered service worker in production
/offline page
cached app shell
cached static assets
stale-data warning
basic cached emergency snapshot
offline-safe SOS copy/draft behavior or clear limitation
```

## Privacy and Safety Policy Decisions

Before implementation, decide what should be cached.

### Low Risk to Cache

```txt
public shelter records
public weather alerts
public government notices
data source status
simulation scenario data
static map boundaries
weather icons
```

### Medium or High Risk to Cache

```txt
saved locations
exact user coordinates
emergency contacts
phone numbers
SOS messages
notification history
profile details
```

Recommended policy:

```txt
Cache public emergency data by default.
Cache personal data only if needed and clearly justified.
Avoid caching phone numbers and SOS message history in the first PWA version.
```

## Verification Checklist

Run production build:

```txt
npm run build
npm run start
```

Check in browser:

```txt
Application tab -> Manifest loads
Application tab -> Service worker registered
Application tab -> Cache storage populated
Lighthouse -> PWA checks pass or known gaps documented
Offline mode -> /offline loads
Offline mode -> app shell loads
Offline mode -> cached data is labeled stale
Mobile browser -> install prompt appears
Installed app -> opens in standalone mode
```

Deployment requirement:

```txt
Use HTTPS.
PWA installability will not work reliably on plain HTTP except localhost.
```

## Recommended Final Scope

For a practical Emergency OS PWA deployment, implement:

```txt
manifest + icons
service worker generation
offline page
offline banner
static asset caching
last emergency snapshot cache
stale data labels
list-based fallback for map data
simple install prompt
```

Omit for now:

```txt
push notifications
offline map tiles
background sync
automatic SOS delivery
SMS/WhatsApp provider integration
full offline admin functionality
```

This keeps the PWA aligned with the concept of an offline-capable emergency
information app without overpromising life-critical functionality.
