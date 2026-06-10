# Emergency Timeline Plan and Implementation

Date: 2026-06-10

## Objective

Create a public Emergency Timeline page that explains:

```txt
what emergency transition happened
when it happened
where it happened
which shelters opened or closed
when weather alerts were issued or expired
how the active-shelter count changed over time
```

The implementation is additive and intentionally separate from the existing
current-state emergency provider.

## Stored Implementation Plan

### Phase 1: Reliable Historical Events

```txt
add sync-run tracking
add immutable public timeline events
detect shelter openings by comparing successful JKM sync sets
detect shelter closures only after a successful JKM response
record weather alert issue and expiry events
use deterministic event keys to prevent duplicates
```

### Phase 2: Timeline Data Layer

```txt
define timeline-specific domain types
add live historical provider
add simulation historical provider
build baseline-aware active-shelter count series
keep timeline queries separate from current-state queries
```

### Phase 3: Timeline Page

```txt
create /timeline
add live/simulation mode switching
add date-range, state, and event-type filters
add active-shelter time graph
add chronological event list
link shelter events to the map
```

### Phase 4: Documentation and Rollback

```txt
document data authority and event generation
provide additive migration
provide destructive manual rollback SQL
list deployment and verification order
preserve existing shelter, weather, notification, and SOS behavior
```

## Implemented Architecture

### Current State Versus History

The system now keeps these responsibilities separate:

```txt
EmergencyDataSnapshot and current providers
  -> answer "what is happening now?"

EmergencyTimelineSnapshot and timeline providers
  -> answer "what changed, and when?"
```

This prevents historical queries from complicating the current dashboard, map,
alerts, SOS, reports, and offline data paths.

## Database Model

Migration:

```txt
supabase/migrations/011_emergency_timeline.sql
```

### `emergency_sync_runs`

One row per JKM or METMalaysia synchronization attempt:

```txt
id
source
status: running | succeeded | failed
started_at
completed_at
records_received
error_message
```

This provides an audit trail and links generated events to the sync that
observed them.

### `emergency_timeline_events`

Immutable public event ledger:

```txt
event_key
event_type
occurred_at
ended_at
shelter_id
weather_alert_id
disaster_type
state
district
title
description
metadata
source
sync_run_id
```

Supported first-version event types:

```txt
shelter_opened
shelter_closed
shelter_capacity_changed
weather_alert_issued
weather_alert_expired
```

`shelter_capacity_changed` is reserved by the contract but is not generated
yet. This avoids changing the schema when capacity-change policy is designed.

### Privacy Boundary

The event ledger contains public emergency information only.

It deliberately excludes:

```txt
saved locations
personal notifications
SOS requests
emergency contacts
user identifiers
exact user coordinates
```

## Event Generation

### Shelter Opening and Closing

Each successful JKM sync compares:

```txt
previous successful active shelter set
versus
current successful open-shelter response
```

Rules:

```txt
current but not previous -> shelter_opened
previous but not current -> shelter_closed
present in both -> no open/close event
failed JKM request -> no closure events
```

This is important because a failed external request is not evidence that a
shelter closed.

Snapshots are still stored every successful run for operational history.
Timeline events are stored only when a meaningful transition occurs.

### Weather Alerts

Rules:

```txt
new deterministic weather alert ID -> weather_alert_issued
valid_to reached -> weather_alert_expired
existing alert seen again -> no duplicate issued event
```

Unique `event_key` values make repeated syncs idempotent.

## Timeline Domain Layer

### `types/timeline.ts`

Defines:

```txt
EmergencyTimelineEvent
TimelineShelterCountPoint
EmergencyTimelineSnapshot
TimelineQuery
TimelineEventType
```

### `data/providers/live-timeline-provider.ts`

Responsibilities:

```txt
query public timeline events
apply date, state, and event filters
calculate active shelters already open before the selected range
load independent shelter transitions for the graph
return a safe unavailable state before migration 011 is deployed
```

The graph query is intentionally independent from the event-list type filter.
Filtering the list to weather alerts does not erase shelter transitions from
the active-shelter graph.

### `data/providers/simulation-timeline-provider.ts`

Uses events from the user's active uploaded simulation scenario. When no active
scenario is available, it falls back to deterministic built-in events. The
built-in scenario demonstrates:

```txt
weather warning issued
three shelters opened
one shelter closed
weather warning expired
one shelter reopened
```

## Custom Simulation Excel Timeline

The Simulation Data Dashboard now downloads
`emergency_os_scenario_template.xlsx`. The template includes:

```txt
Shelters
WeatherAlerts
Forecasts
TimelineEvents
```

The `Shelters` sheet includes the newer disaster and operational fields:

```txt
disasterType
status
operationalStatus
lastUpdatedAt
```

The `Forecasts` sheet also includes `rainfall`, stored as a JSON object. Import
validation now checks required shelter, alert, and forecast fields before a
scenario is stored.

The optional `TimelineEvents` sheet allows a custom uploaded scenario to drive
the Emergency Timeline page. Its columns are:

```txt
id
eventType
occurredAt
endedAt
shelterId
weatherAlertId
disasterType
state
district
title
description
source
metadata
```

Required values:

```txt
eventType
occurredAt
title
```

Supported `eventType` values:

```txt
shelter_opened
shelter_closed
shelter_capacity_changed
weather_alert_issued
weather_alert_expired
```

`occurredAt` and optional `endedAt` must be valid date-time values.
`metadata` must be blank or a JSON object such as:

```json
{"previousStatus":"closed","newStatus":"open"}
```

The upload boundary validates these values before storing the scenario. Invalid
rows report their worksheet row number. Blank IDs are generated automatically,
and blank sources default to `simulation`.

### Backward Compatibility

`TimelineEvents` is optional. Existing workbooks containing only `Shelters`,
`WeatherAlerts`, and `Forecasts` still upload successfully, but their Emergency
Timeline will contain no custom events.

Activating or uploading a scenario revalidates `/timeline`, so the selected
scenario becomes visible without redeploying the application.

### `lib/timeline/build-shelter-count-series.ts`

Pure function that creates the graph series from open/close events.

It receives an initial baseline representing shelters already active before the
selected range. Without that baseline, a seven-day graph could incorrectly
start at zero even when shelters opened earlier.

## User Interface

Route:

```txt
/timeline
```

Navigation links were added to desktop and mobile navigation.

### Filters

```txt
date range: 24 hours, 7 days, 30 days, 90 days
state
event type
live/simulation mode
```

Filters are server-side query parameters. The page remains shareable and does
not require client-side state management.

### Active Shelter Graph

The graph shows the active-shelter count after each verified opening or closing
transition. It is implemented with accessible HTML and CSS instead of adding a
new chart dependency.

Each graph column includes:

```txt
exact shelter count
event time
transition color
browser tooltip
screen-reader graph label
```

### Chronological Event List

The event list shows:

```txt
event type
title
occurred time
description
disaster type
state and district
map link for shelter events
```

## Files Added

```txt
app/timeline/page.tsx
components/timeline/ActiveShelterGraph.tsx
components/timeline/TimelineDashboard.tsx
data/providers/live-timeline-provider.ts
data/providers/simulation-timeline-provider.ts
data/providers/timeline-provider.ts
lib/timeline/build-shelter-count-series.ts
types/timeline.ts
supabase/migrations/011_emergency_timeline.sql
supabase/rollback/011_emergency_timeline.sql
temp/emergency-timeline-plan-and-implementation.md
```

## Files Modified

```txt
app/layout.tsx
components/NavMenu.tsx
components/test-ui/TestUiShell.tsx
data/mock/emergency-scenarios.ts
data/providers/simulation-timeline-provider.ts
supabase/functions/sync-live-data/index.ts
types/emergency.ts
app/profile/sim-actions.ts
app/simulation/page.tsx
```

## Deployment Order

Migration 010 from the disaster-aware shelter feature must already be applied.

Then:

1. Apply `supabase/migrations/011_emergency_timeline.sql`.
2. Deploy the updated `sync-live-data` Edge Function.
3. Deploy the Next.js application.
4. Trigger one successful live-data sync.
5. Open `/timeline?mode=live`.

The timeline begins recording transitions after deployment. Migration 011 does
not invent historical open/close events from old snapshots because doing so
could produce misleading closure times.

## Verification Checklist

### Simulation

```txt
/timeline?mode=simulation renders
graph rises when shelters open
graph falls when shelter closes
graph rises when shelter reopens
weather-only filter leaves shelter graph intact
state filter limits events and graph
event list remains newest first
```

### Live

```txt
successful JKM sync creates a succeeded sync run
failed JKM sync creates a failed sync run
failed JKM sync creates no shelter closure events
new shelter creates one shelter_opened event
missing shelter after successful sync creates one shelter_closed event
repeated unchanged sync creates no duplicate transitions
new weather alert creates one issued event
expired weather alert creates one expired event
```

### Privacy

```txt
timeline table contains no user IDs
timeline page contains no saved locations
timeline page contains no notifications or SOS records
public RLS allows read-only timeline access
```

## Rollback

### Code-Only Rollback Before Migration

Revert only the files listed under `Files Added` and `Files Modified`.

To roll back only custom Excel timeline support while retaining the Emergency
Timeline feature, revert:

```txt
app/simulation/page.tsx
app/profile/sim-actions.ts
data/providers/simulation-timeline-provider.ts
the Custom Simulation Excel Timeline section in this document
```

No database rollback is required because uploaded scenarios already use a
JSONB data document.

### Rollback After Migration

Safest rollback:

1. Revert and deploy the previous `sync-live-data` Edge Function.
2. Revert and deploy the previous Next.js application.
3. Leave the additive timeline tables in place but unused.

Leaving unused additive tables preserves history and carries less risk.

Destructive rollback, only when timeline history should be permanently deleted:

```txt
supabase/rollback/011_emergency_timeline.sql
```

That script drops:

```txt
emergency_timeline_events
emergency_sync_runs
```

Do not use a broad Git hard reset when unrelated work exists.

## Execution Summary

Completed:

```txt
immutable public event ledger
sync-run audit records
shelter opening and closure detection
weather issuance and expiry detection
duplicate-resistant event keys
live and simulation timeline providers
baseline-aware active-shelter graph
server-side timeline filters
chronological event list
desktop and mobile navigation
additive migration and rollback SQL
custom TimelineEvents workbook sheet
validated custom timeline event import
active uploaded scenario timeline selection
```

Deferred:

```txt
capacity-change event policy
district filter
custom date picker
timeline PDF export
offline timeline caching
automatic long-term aggregation and retention
advanced proportional-time swimlane graph
```

## Validation Results

Completed locally:

```txt
TypeScript validation passed
focused timeline lint passed
production Next.js/PWA build passed
/timeline?mode=simulation returned HTTP 200
simulation shelter events rendered
filtered simulation timeline returned HTTP 200
/timeline?mode=live returned HTTP 200 before migration deployment
live pre-migration route displayed the safe unavailable-state message
git diff --check passed
custom simulation workbook TypeScript validation passed
custom simulation workbook focused lint passed
/simulation returned HTTP 200 after the workbook update
/timeline?mode=simulation returned HTTP 200 using the active-scenario provider
```

Repository-wide lint still reports existing errors outside the timeline
implementation.

The Supabase Edge Function could not be checked with `deno check` because Deno
is not installed in this local environment. Validate the function during the
Supabase deployment step before enabling scheduled syncs.
