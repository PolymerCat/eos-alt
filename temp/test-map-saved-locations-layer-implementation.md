# Test Map Saved Locations Layer

Date: 2026-06-08

## Purpose

`/test-map` can now switch between two map layers:

```txt
Shelters
Saved Locations
```

The feature lets users inspect their personal saved places directly on the map
instead of only viewing active shelter/PPS records.

## Data Flow

The page keeps using the shared emergency data provider:

```txt
app/test-map/page.tsx
  -> getEmergencyData({ mode })
  -> data.shelters
  -> data.savedLocations
  -> components/tests/map.test.tsx
```

This keeps live and simulation behavior aligned. The map does not import mock
scenario data directly.

## Layer Model

The client map uses:

```ts
type TestMapLayer = "shelters" | "saved_locations";
```

Shelters and saved locations remain separate data models:

```txt
PPS[]             for shelters
SavedLocation[]   for saved places
```

They are only switched at the marker/list rendering boundary.

## Behavior

### Shelter Layer

- Red markers
- Shelter popup
- Shelter sidebar cards
- State hover counts show shelter counts
- Selected detail card shows shelter status/capacity

### Saved Locations Layer

- Blue markers
- Saved-location popup
- Saved-location sidebar cards
- State hover counts show saved-location counts
- Selected detail card shows label, district/state, description, coordinates

### Side-Panel Selection

Selecting a shelter or saved location from the side panel:

```txt
selects the record
flies the map to its coordinates
closes any other open popup
automatically opens the selected marker popup
```

The implementation uses `marker.togglePopup()` rather than calling
`popup.addTo(map)` directly. MapLibre assigns an attached popup its marker
coordinates during the marker toggle operation, making this the reliable way
to open marker-owned popups programmatically.

## Files Changed

```txt
app/test-map/page.tsx
components/tests/map.test.tsx
components/tests/sidebar.test.tsx
temp/test-map-saved-locations-layer-implementation.md
```

## Rollback

Because this is a contained feature, rollback is a targeted Git revert of the
files listed above.

If the named-location schema migration from
`supabase/migrations/009_named_saved_locations.sql` is also being rolled back,
use the rollback instructions in:

```txt
temp/saved-locations-personal-labels-implementation.md
```

## Future Improvements

- Add saved-location editing directly from the map popup.
- Add a nearest-shelter action from a selected saved location.
- Add a map legend that changes color/count labels with the active layer.
- Share marker rendering between `/test-map` and production map components.
