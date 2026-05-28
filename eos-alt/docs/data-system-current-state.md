# Emergency OS Data System: Current State and Direction

This document explains how Emergency OS currently gets data, how that data reaches the UI, how live and simulation data are separated today, and how the system should evolve into a true switchable data system with historical storage.

## High-Level Summary

The project currently has two data paths:

1. **Current production pages**
   - Use live API data directly through `app/actions.tsx`.
   - Use Supabase directly through `app/profile/actions.ts`.
   - Examples: `/`, `/map`, `/profile`.

2. **Prototype/test UI pages**
   - Use the provider layer in `data/providers`.
   - Can switch between `live` and `simulation`.
   - Examples: `/test-ui`, `/test-ui/weather`, `/test-ui/alerts`, `/test-ui/sos`, `/test-ui/reports`.

The provider layer is the beginning of the future architecture. It gives UI pages one common `EmergencyDataSnapshot` shape, regardless of whether the data came from real APIs, Supabase, or mock simulation scenarios.

## Current Data Flow

### Live API Flow

```txt
Government API
  -> app/actions.tsx
  -> page or provider
  -> UI component
```

For example:

```txt
JKM API
  -> getAlerts()
  -> app/map/page.tsx
  -> components/map.tsx
  -> components/MapMarkersLayer.tsx
```

Weather works similarly:

```txt
api.data.gov.my/weather/warning
  -> getWeatherWarnings()
  -> app/page.tsx or app/test-ui/page.tsx
  -> LiveUpdateBar / weather cards
```

### Supabase Flow

```txt
Supabase database
  -> app/profile/actions.ts
  -> page or provider
  -> UI component
```

Current Supabase tables are:

- `profiles`
- `states`
- `districts`
- `user_locations`

These tables support authentication-adjacent profile data and saved locations. They do not yet store shelter history, weather alert history, notifications, SOS requests, reports, or simulation imports.

### Simulation Flow

```txt
data/mock/emergency-scenarios.ts
  -> data/providers/simulation-provider.ts
  -> data/providers/emergency-data-provider.ts
  -> /test-ui pages
```

Simulation data is not random placeholder data. It is scenario-shaped data that follows the same entity shapes used by the UI, such as shelters, weather alerts, saved locations, notifications, SOS requests, emergency contacts, and reports.

## File Responsibilities

### `app/actions.tsx`

This is the current live external API action file.

It exports:

- `PPS`
- `WeatherWarning`
- `getAlerts()`
- `getWeatherWarnings()`

`getAlerts()` fetches open PPS/shelter data from:

```txt
https://infobencanajkmv2.jkm.gov.my/api/pusat-buka.php?a=0&b=0
```

It normalizes raw JKM records into the `PPS` interface:

- `id`
- `name`
- `latti`
- `longi`
- `negeri`
- `daerah`
- `mukim`
- `bencana`
- `mangsa`
- `keluarga`
- `kapasiti`

`getWeatherWarnings()` fetches weather warnings from:

```txt
https://api.data.gov.my/weather/warning/
```

It returns records matching the `WeatherWarning` interface.

Important current limitation:

- `getAlerts()` fetches live JKM data but does not save it to Supabase.
- This means there is currently no historical shelter timeline.
- If the live API returns empty data, the app has no past records to fall back to unless simulation mode is used.

### `app/profile/actions.ts`

This file contains Supabase server actions for current user and location data.

It exports:

- `getProfile()`
- `updateProfile()`
- `getStates()`
- `getDistricts(stateCode)`
- `getUserLocations()`
- `saveLocation(state, district, lat, lng)`
- `deleteLocation(locationId)`

This is the current database-backed part of the system. It reads and writes user-owned saved locations and reads static state/district lookup data.

`getUserLocations()` joins:

```txt
user_locations
  -> states
  -> districts
```

This is used by the homepage and live provider to personalize data by saved district/location.

### `types/emergency.ts`

This is the shared domain contract for the newer provider-based architecture.

It defines:

- `DataMode`
- `SavedLocation`
- `WeatherAlert`
- `AlertPreference`
- `NotificationRecord`
- `EmergencyContact`
- `SosRequest`
- `GovernmentNotice`
- `EmergencyReport`
- `DataSourceStatus`
- `EmergencyScenario`
- `EmergencyDataSnapshot`

The most important type is `EmergencyDataSnapshot`.

That snapshot is the standard shape that test UI pages consume:

```ts
{
  mode,
  shelters,
  weatherWarnings,
  weatherAlerts,
  savedLocations,
  alertPreferences,
  notifications,
  sosRequests,
  emergencyContacts,
  governmentNotices,
  reports,
  dataSources
}
```

The goal is that UI pages should eventually depend on this snapshot, not on direct API calls.

### `data/providers/emergency-data-provider.ts`

This is the switchboard.

It exports:

- `normalizeDataMode(value)`
- `getEmergencyData(options)`

`normalizeDataMode()` reads a string such as `live` or `simulation` and converts it into the safe `DataMode` type.

Current behavior:

- `mode=live` calls `getLiveEmergencyData()`.
- anything else defaults to simulation and calls `getSimulationEmergencyData()`.

This file is the main entry point for pages that want switchable data.

### `data/providers/live-provider.ts`

This provider builds an `EmergencyDataSnapshot` from live sources.

It currently calls:

- `getAlerts()`
- `getWeatherWarnings()`
- `getUserLocations()`

It maps Supabase user locations into the shared `SavedLocation` type.

Current live snapshot behavior:

- `shelters` comes from JKM API.
- `weatherWarnings` comes from `api.data.gov.my`.
- `savedLocations` comes from Supabase.
- future arrays such as `notifications`, `sosRequests`, `reports`, and `governmentNotices` are currently empty.
- `dataSources` is generated dynamically to show whether live feeds returned records.

Important limitation:

The live provider currently reads live API data only. It does not persist live API responses into database tables.

### `data/providers/simulation-provider.ts`

This provider builds an `EmergencyDataSnapshot` from a scenario.

It reads from:

```txt
data/mock/emergency-scenarios.ts
```

Current behavior:

- If a `scenarioId` is passed, it tries to find that scenario.
- If no scenario is found, it uses `defaultScenario`.
- It returns the same `EmergencyDataSnapshot` shape as the live provider.

This means `/test-ui` pages can render simulation and live data through the same UI shape.

### `data/mock/emergency-scenarios.ts`

This contains scenario data.

The current default scenario is a severe Kelantan flood simulation. It includes:

- PPS shelter records
- weather warnings
- normalized weather alerts
- saved locations
- alert preferences
- notifications
- SOS requests
- emergency contacts
- government notices
- reports
- data source statuses

This is useful for demos and development because real emergency APIs may return no active emergencies most of the time.

### `app/page.tsx`

This is the current main homepage.

It does not use the provider layer yet.

Current flow:

```txt
createClient()
  -> get current Supabase user
getAlerts()
  -> live JKM shelter data
getWeatherWarnings()
  -> live weather warnings
if user exists:
  getUserLocations()
  -> extract saved districts
  -> filter shelter alerts by saved districts
render dashboard cards
render LiveUpdateBar
```

If the user is logged in, alerts are filtered by saved district. If the user is not logged in, the page currently shows all fetched alerts.

This is an early form of personalization, but it is not yet a full alert matching system.

### `app/map/page.tsx`

This is the current production map route.

Current flow:

```txt
getAlerts()
  -> pass PPS[] to <Map />
```

It uses live JKM data directly.

It does not use simulation mode yet.

### `components/map.tsx`

This is the production MapLibre map component.

It receives:

```ts
ppsData: PPS[]
```

It:

- initializes MapLibre
- uses OpenFreeMap tiles
- centers on Malaysia
- limits map bounds around Malaysia
- loads `/MY-box.geojson`
- adds a Malaysia border layer
- renders `MapSidebar`
- renders `MapMarkersLayer` after the map is loaded

This component does not fetch shelter data itself. It only receives already-fetched data from `app/map/page.tsx`.

### `components/MapMarkersLayer.tsx`

This component turns `PPS[]` into a MapLibre GeoJSON source and marker layer.

It:

- maps `latti` and `longi` into point coordinates
- creates or updates the `pps-data` GeoJSON source
- creates a pulsing red dot marker image
- adds a `pps-layer` symbol layer
- creates popups using shelter properties

Current limitation:

- popup HTML is built with raw HTML strings.
- in the future, React-rendered popups would be cleaner and safer.

### `app/test-ui/page.tsx`

This is the current test dashboard.

It uses both:

- `getEmergencyData({ mode })`
- `getWeatherWarnings()`

The provider returns the main snapshot. The page also calls live weather warnings directly for part of the dashboard display.

Current flow:

```txt
searchParams.mode
  -> normalizeDataMode()
  -> getEmergencyData({ mode })
  -> dashboard cards

getWeatherWarnings()
  -> live weather ticker and live warning cards
```

In simulation mode:

- most dashboard data comes from the mock scenario.

In live mode:

- provider data comes from live APIs and Supabase where available.

Potential improvement:

- The dashboard should eventually avoid direct `getWeatherWarnings()` calls and rely fully on `getEmergencyData()`. That would make the live/simulation switch cleaner.

### `components/test-ui/Card.tsx`

This is a reusable dashboard card component.

It accepts:

- `title`
- `description`
- `children`
- normal `div` props

It is useful for prototype pages because it keeps visual structure consistent while allowing each card to have custom content.

### `components/live-update-bar.tsx`

This is a client component for the scrolling weather warning ticker.

It receives:

```ts
warnings: WeatherWarning[]
```

If there are no warnings, it renders nothing.

If warnings exist, it displays them in a fixed bottom ticker.

## Current Architectural Gap

The project currently separates live and simulation data at the provider level, but live data is not yet stored historically.

That means:

- live data can be displayed
- simulation data can be displayed
- Supabase user locations can be saved
- but live shelter/weather snapshots are not persisted
- historical timelines cannot be built yet from real live data
- chronological emergency views need new database tables and ingestion jobs

## Target Architecture

The target should be:

```txt
Live API
  -> ingestion/normalization service
  -> database tables
  -> provider
  -> UI

Simulation scenarios
  -> simulation import/normalization service
  -> same database tables or scenario tables
  -> provider
  -> UI
```

The key principle:

**Live and simulation data should pass through the same normalized data model before reaching the UI.**

That allows the UI to switch modes without knowing where the data came from.

## Recommended Future Tables

To support history and chronological views, add tables like:

- `data_snapshots`
- `shelter_snapshots`
- `weather_alerts`
- `government_notices`
- `notifications`
- `alert_preferences`
- `sos_requests`
- `emergency_contacts`
- `reports`
- `simulation_scenarios`
- `simulation_scenario_records`

For historical shelter data, avoid only storing one mutable `shelters` row per shelter. Instead, store snapshots over time.

Example concept:

```txt
shelters
  stable identity for known shelters

shelter_snapshots
  shelter_id
  source
  mode
  captured_at
  capacity
  victims
  families
  status
  raw_payload
```

This supports:

- current map display
- historical trend display
- chronological emergency timeline
- audit/debugging
- comparing live vs simulation behavior

## Recommended Provider Direction

Eventually, the provider should not directly call government APIs during UI rendering.

Instead:

```txt
scheduled ingestion
  -> fetch API
  -> normalize
  -> save database snapshot

UI request
  -> provider
  -> query latest database snapshot for selected mode
  -> return EmergencyDataSnapshot
```

This gives better:

- performance
- reliability
- historical records
- fallback behavior
- simulation/live consistency

## Mode Switching Direction

Current mode switching uses query params:

```txt
?mode=simulation
?mode=live
```

This is good for prototype review.

Later, mode can be selected by:

- query param for demos
- user/admin setting
- cookie
- environment variable
- admin scenario selector

Every mode should be visibly labeled in the UI so users do not confuse simulated data with live emergency data.

## Important Rule for Future AI Models

When adding new UI pages:

Do not import mock scenario data directly into pages.

Prefer:

```ts
getEmergencyData({ mode })
```

Then render from the returned `EmergencyDataSnapshot`.

When adding new live data:

Do not wire the UI directly to a new API unless it is temporary.

Prefer:

```txt
API fetch
  -> normalize
  -> save/query through provider
  -> UI
```

This keeps the project moving toward a true harmonized data system.
