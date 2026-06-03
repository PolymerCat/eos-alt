# Simulation Mode Architecture

Emergency OS needs live government data for real usage, but live emergency APIs can be empty when there is no active disaster. Simulation mode exists so the application can still be tested, demonstrated, and reviewed with realistic emergency conditions.

## Data Contract

Pages and components should not import mock data directly. They should call the shared provider in `data/providers/emergency-data-provider.ts`.

The provider returns an `EmergencyDataSnapshot`, defined in `types/emergency.ts`. This snapshot is the stable contract between UI code and the data layer.

## Modes

- `simulation`: Uses scenario data from `data/mock/emergency-scenarios.ts`.
- `live`: Uses the current JKM, METMalaysia, and Supabase calls where available.

The current prototype routes switch modes through a query parameter:

```txt
?mode=simulation
?mode=live
```

## Why This Pattern

This keeps UI components independent from data source details. A map panel, alert card, report preview, or SOS page can render the same shape of data whether the record came from a government API, Supabase, cached offline data, or a simulation scenario.

## Future Work

When the planned ERD tables are added, the live provider should be expanded first. Existing prototype pages should continue to work because their dependency is the snapshot contract, not individual database tables.
