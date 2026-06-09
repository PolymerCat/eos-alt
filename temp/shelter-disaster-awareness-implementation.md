# Shelter Disaster Awareness Implementation

Date: 2026-06-10

## Purpose

Shelters now communicate both:

```txt
operational state
  -> is the shelter currently active or inactive?

disaster type
  -> what emergency caused the current shelter activation?
```

These are deliberately separate from capacity:

```txt
capacity status
  -> available, filling, nearly full, or critical
```

This prevents the UI from treating "online", "available", and "flood" as
interchangeable concepts.

## Core Correctness Change

Previously, `disaster_type` existed only on the permanent `shelters` row.

That model could become misleading:

```txt
shelter opens for flood
  -> shelters.disaster_type becomes BANJIR

shelter later closes
  -> permanent row can still contain BANJIR

UI displays saved shelter record
  -> old flood may appear current
```

The new authority is the activation snapshot:

```txt
shelters
  -> permanent identity and location

shelter_snapshots
  -> current/historical activation state
  -> disaster_type for that activation
  -> victims, families, capacity, captured_at
```

The legacy `shelters.disaster_type` column remains in place temporarily for
compatibility and rollback.

## Data Flow

### Successful JKM Sync With Open Shelters

```txt
JKM open-shelter API
  -> normalize bencana as disaster_type
  -> upsert permanent shelter identity
  -> insert new active snapshots with one shared captured_at timestamp
  -> close active snapshots older than the new timestamp
```

New snapshots are inserted before older snapshots are closed. If insertion
fails, the previous active set remains available. This is safer than closing
all records before proving that the replacement set was stored.

### Successful JKM Sync With No Open Shelters

```txt
successful empty response
  -> close every previously active snapshot
```

### Failed JKM Sync

```txt
network/API failure
  -> do not close active snapshots
  -> record sync error
```

A failed request is not evidence that shelters have closed.

## Database Changes

Migration:

```txt
supabase/migrations/010_shelter_snapshot_disaster_type.sql
```

It adds:

```sql
shelter_snapshots.disaster_type TEXT
idx_shelter_snapshots_status_captured
```

The migration is additive. It does not remove or rewrite the legacy
`shelters.disaster_type` column.

Manual rollback SQL:

```txt
supabase/rollback/010_shelter_snapshot_disaster_type.sql
```

The rollback script removes only the migration 010 column and index.

## Compatibility Model

The existing `PPS` shape remains available because it is used throughout the
current application.

New optional fields:

```ts
disasterType?: string | null;
operationalStatus?: "active" | "inactive" | "unknown";
lastUpdatedAt?: string;
```

Legacy fields remain:

```ts
bencana: string;
status: string;
```

Live active records populate both old and new fields. Inactive saved shelter
records intentionally clear the current disaster:

```txt
disasterType = null
bencana = ""
operationalStatus = inactive
status = offline
```

This makes rollback possible while preventing stale disaster display.

## Shared Disaster Presentation

Domain helper:

```txt
lib/shelters/disaster.ts
```

Responsibilities:

```txt
resolve active/inactive state
normalize whitespace and casing
map common Malay/English source values to readable labels
preserve unknown upstream values
return safe missing/inactive labels
```

Known examples:

```txt
BANJIR       -> Flood
TANAH RUNTUH -> Landslide
RIBUT        -> Storm
KEBAKARAN    -> Fire
JEREBU       -> Haze
GEMPA BUMI   -> Earthquake
```

Unknown source values are displayed rather than discarded.

Fallback labels:

```txt
inactive shelter -> No active emergency
active shelter with missing type -> Emergency type unavailable
```

Shared UI component:

```txt
components/shelters/DisasterBadge.tsx
```

All React shelter surfaces should use this component instead of independently
formatting `bencana`.

## Updated User Surfaces

Disaster information is now shown in:

```txt
standard map sidebar and popup
/test-map shelter cards, popup, and selected detail
/shelters cards and selected detail
/dashboard shelter cards
/admin/shelters
/offline cached shelter cards
report preview
generated PDF shelter list
saved-location shelter notifications
simulation saved-location notifications
```

The standard `/map` route now reads through the shared emergency data provider
instead of maintaining a separate Supabase-to-PPS mapper.

## Simulation Behavior

Simulation shelter records continue accepting the existing `bencana` field.

The simulation provider normalizes every shelter into the new compatibility
fields:

```txt
active scenario shelter
  -> disasterType from disasterType or bencana
  -> operationalStatus active

offline scenario shelter
  -> disasterType null
  -> operationalStatus inactive
```

The existing Excel template already contains `bencana`, so old templates remain
compatible.

## Deployment Order

Use this order to avoid querying a missing database column:

1. Apply `supabase/migrations/010_shelter_snapshot_disaster_type.sql`.
2. Deploy the updated `sync-live-data` Edge Function.
3. Deploy the Next.js application.
4. Trigger one successful live-data sync.
5. Verify active shelters show current disaster types.
6. Verify inactive saved shelters show `No active emergency`.

The first successful sync after deployment closes historical snapshots that
were incorrectly left active by the old ingestion lifecycle.

## Verification Checklist

### Live Data

```txt
active snapshot contains disaster_type
new sync closes older active snapshots
successful empty sync closes all active snapshots
failed upstream request does not close snapshots
latest snapshot wins when reading shelter state
inactive shelter does not display legacy shelters.disaster_type
```

### UI

```txt
active flood shelter displays Flood
active missing-type shelter displays Emergency type unavailable
inactive shelter displays No active emergency
unknown disaster text remains visible
map popups and sidebars agree
offline cached shelters retain disaster context from the cached snapshot
reports and PDFs include disaster type
notification titles mention known disaster types
```

### Simulation

```txt
default BANJIR shelters display Flood
uploaded Excel bencana values are preserved
offline simulated shelter displays No active emergency
unknown custom values remain visible
```

## Files Added

```txt
components/shelters/DisasterBadge.tsx
lib/shelters/disaster.ts
supabase/migrations/010_shelter_snapshot_disaster_type.sql
supabase/rollback/010_shelter_snapshot_disaster_type.sql
temp/shelter-disaster-awareness-implementation.md
```

## Files Modified

```txt
app/actions.tsx
app/admin/shelters/page.tsx
app/dashboard/page.tsx
app/map/page.tsx
app/profile/actions.ts
app/profile/sim-actions.ts
components/MapMarkersLayer.tsx
components/MapSidebar.tsx
components/pwa/OfflineEmergencyHub.tsx
components/reports/ReportPreview.tsx
components/test-ui/InteractiveMapLayout.tsx
components/test-ui/ShelterCard.tsx
components/tests/MapPopup.tsx
components/tests/shelter-card.test.tsx
components/tests/sidebar.test.tsx
data/providers/live-provider.ts
data/providers/simulation-provider.ts
lib/reporting/build-report.ts
lib/reporting/pdf.ts
supabase/functions/sync-live-data/index.ts
types/reporting.ts
```

## Rollback

### Before Applying the Migration

Revert only the files listed in this document. No database rollback is needed.

### After Applying the Migration

1. Revert the application and Edge Function files listed above.
2. Deploy the reverted Edge Function and application.
3. Run:

```txt
supabase/rollback/010_shelter_snapshot_disaster_type.sql
```

The application remains compatible if the added snapshot column is left in the
database, so dropping it is optional. Keeping an unused additive column is the
lower-risk rollback when historical disaster values may still be useful.

### Git Safety

Use a normal revert commit after these changes are committed. Before commit,
restore only the listed paths. Do not use a broad hard reset when unrelated
work exists in the worktree.

## Future Refinements

Not included in this implementation:

```txt
filter map by disaster category
admin disaster-count summary
disaster-specific marker icons
database view that returns the latest shelter activation
strict replacement of the legacy PPS model
removal of shelters.disaster_type after the compatibility period
```

Those refinements can be added after the new snapshot lifecycle has been
verified against several successful live syncs.
