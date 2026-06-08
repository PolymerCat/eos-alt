# Saved Locations: Personal Labels Implementation

Date: 2026-06-08

## Purpose

Saved locations now represent a user's personal places, not only an
administrative state/district pair. A user can save multiple locations in the
same state and district as long as each row has its own identity.

Examples:

- Family Home
- Mama's Home
- Office
- Hostel
- Kampung House

The location label is the user-facing name. State, district, latitude, and
longitude remain the data used for matching shelters, weather alerts, and map
context.

## Design Decision

The system uses `label` instead of `name`.

Reason:

- `name` is already overloaded across shelters, users, states, and districts.
- `label` clearly means "the user's personal label for this saved place".
- This matches the existing `SavedLocation` domain type in `types/emergency.ts`.

There is intentionally no uniqueness rule on:

```txt
user_id + state + district
```

This is important because several meaningful places can exist in the same
district. For example, a user may save "Family Home", "Office", and "Mama's
Home" in Kota Bharu, Kelantan.

## Database Changes

Migration:

```txt
supabase/migrations/009_named_saved_locations.sql
```

The migration updates both live and simulation location tables:

```txt
user_locations
simulation_user_locations
```

Columns:

```txt
label TEXT NOT NULL DEFAULT 'Saved Location'
description TEXT NULL
updated_at TIMESTAMPTZ DEFAULT now()
```

Indexes:

```txt
idx_user_locations_user_label
idx_simulation_user_locations_user_label
```

Existing rows with missing labels are backfilled to:

```txt
Saved Location
```

## Application Flow

### Save Live Location

```txt
components/LocationPicker.tsx
  -> saveLocation(input)
  -> app/profile/actions.ts
  -> user_locations insert
  -> immediate emergency/alert check
  -> notifications mention the location label
```

### Save Simulation Location

```txt
components/LocationPicker.tsx
  -> saveSimulationLocation(input)
  -> app/profile/sim-actions.ts
  -> simulation_user_locations insert
  -> immediate simulation emergency/alert check
  -> simulation notifications mention the location label
```

### Provider Output

Live and simulation providers map saved locations into:

```ts
SavedLocation {
  id,
  userId,
  stateCode,
  stateName,
  districtId,
  districtName,
  label,
  description,
  latitude,
  longitude,
  createdAt
}
```

This keeps dashboard, alerts, weather, reports, and future components on the
shared `EmergencyDataSnapshot` contract.

## Validation Rules

Location input is validated server-side before writing:

```txt
label: required, max 60 characters
description: optional, max 160 characters
state: required positive integer
district: required positive integer
latitude: finite number between -90 and 90
longitude: finite number between -180 and 180
```

The client UI also limits label and description length, but server validation is
the actual enforcement boundary.

## User Interface Changes

`components/LocationPicker.tsx` now asks for:

```txt
Location Name
Description
State
District
Map pin
```

The save button is disabled until:

```txt
location label + state + district + coordinates
```

are available.

`app/profile/page.tsx` now shows:

```txt
Personal label first
District, State second
Optional description
Latitude and longitude
```

## Notification Behavior

Immediate generated notifications now include the user label:

```txt
Emergency Shelter Opened Near Family Home
Weather Alert Near Mama's Home
SIMULATION: Shelter Opened Near Office
```

This makes notifications easier to understand when the user has multiple saved
places in one district.

## Files Changed

```txt
supabase/migrations/009_named_saved_locations.sql
app/profile/actions.ts
app/profile/sim-actions.ts
data/providers/live-provider.ts
data/providers/simulation-provider.ts
components/LocationPicker.tsx
app/profile/page.tsx
temp/saved-locations-personal-labels-implementation.md
```

## Rollback

### Rollback Application Code

Because this work is a contained Git change set, the cleanest rollback is to
revert these changed files from Git:

```txt
supabase/migrations/009_named_saved_locations.sql
app/profile/actions.ts
app/profile/sim-actions.ts
data/providers/live-provider.ts
data/providers/simulation-provider.ts
components/LocationPicker.tsx
app/profile/page.tsx
temp/saved-locations-personal-labels-implementation.md
```

Do not use a broad reset if there are unrelated user changes in the worktree.
Prefer a targeted revert or a normal Git revert commit.

### Rollback Database Schema

If migration `009_named_saved_locations.sql` has already been applied and you
need to remove the database additions, run:

```sql
DROP INDEX IF EXISTS idx_user_locations_user_label;
DROP INDEX IF EXISTS idx_simulation_user_locations_user_label;

ALTER TABLE simulation_user_locations
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS label;

ALTER TABLE user_locations
  ALTER COLUMN label DROP NOT NULL,
  ALTER COLUMN label DROP DEFAULT,
  DROP COLUMN IF EXISTS updated_at;
```

Important:

- `user_locations.label` and `user_locations.description` were originally added
  by migration `002_alter_existing_tables.sql`.
- The rollback SQL above keeps those original live columns and only removes the
  new hardening/default behavior from migration 009.
- If you intentionally want to remove the older migration 002 fields too, run:

```sql
ALTER TABLE user_locations
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS label;
```

Only do that if no feature depends on `SavedLocation.label`.

## Future Improvements

Recommended next steps, not part of this change:

- Add edit support for saved location labels and descriptions.
- Add `is_primary` if the dashboard should prioritize one default place.
- Generate stronger alert matching by coordinates instead of district strings.
- Add Supabase generated database types to remove manual row casts.
