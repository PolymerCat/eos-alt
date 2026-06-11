# Reporting Feature Implementation Notes

## Implemented Scope

The first reporting implementation supports:

- Situation Brief report type
- Public sharing audience
- On-page report preview
- Styled browser print / Save as PDF
- Live/simulation mode labels
- No report persistence yet
- Public information only; no personalization context

This matches the agreed first scope from `temp/reporting-feature-plan.md`.

## Files Added

### `types/reporting.ts`

Defines the report contract:

- `ReportType`
- `ReportAudience`
- `ReportGenerationInput`
- `GeneratedReport`
- section and metric shapes

The report contract is separate from `types/emergency.ts` because report output is presentation-oriented, while `EmergencyDataSnapshot` is the domain data contract.

### `lib/reporting/build-report.ts`

Contains the pure report-generation logic.

It accepts:

```ts
EmergencyDataSnapshot
ReportGenerationInput
```

It returns:

```ts
GeneratedReport
```

This file has no React, browser, or Supabase dependency. That makes it easier to test and keeps the preview/PDF output consistent because both use the same generated report object.

### Styled PDF Output

The report preview is now the printable document. Selecting:

```txt
Print / Save as PDF
```

opens the browser print dialog. Choosing `Save as PDF` preserves the preview's:

```txt
title and mode badge
summary typography
metric cards
section icons and bullets
online shelter cards
status colors
disclaimer panel
```

Dedicated `@media print` rules in `app/globals.css`:

```txt
hide navigation, controls, and unrelated page content
show only ReportPreview
use A4 portrait layout
retain colors during printing
remove browser-only shadows
keep metric and shelter cards together when possible
use three metric columns and two shelter columns on paper
```

The previous hand-built plain-text generator in `lib/reporting/pdf.ts` was
removed. Keeping one visual report implementation prevents preview/PDF design
drift.

### `components/reports/ReportBuilder.tsx`

Client component for:

- generating a preview
- opening the styled browser PDF workflow
- showing the fixed first-scope controls
- avoiding refetches when generating the report

It receives the already-loaded `EmergencyDataSnapshot` from the server page.

### `components/reports/ReportPreview.tsx`

Reusable display component for the generated report.

It renders:

- generated timestamp
- mode badge
- summary
- icon-backed key metrics
- report sections as short bullet points
- online shelter cards with green status dots
- online shelter details: name, state, district, and coordinates
- disclaimer

## Page Updated

### `app/test-ui/reports/page.tsx`

The page now:

- loads the selected mode with `normalizeDataMode`
- gets data through `getEmergencyData({ mode })`
- passes the snapshot to `ReportBuilder`

It no longer depends on `data.reports[0]`, so live mode can generate reports even when no report records exist in the database.

## Best Practices Used

- The page still uses the shared provider layer instead of importing mock data directly.
- Report generation is deterministic and template-based, not AI-generated.
- The report builder is pure and isolated from UI code.
- The PDF output and page preview use the same `GeneratedReport` object.
- Report content is structured as points instead of dense paragraphs.
- The print dialog opens only when the user clicks `Print / Save as PDF`.
- The public report excludes private emergency contact details.
- The public report excludes saved-location, notification, and SOS personalization context.
- Simulation mode is clearly labeled in the generated report and disclaimer.

## Performance Notes

- The report is built from the already-loaded snapshot, so changing report controls does not trigger another API request.
- No PDF package or server browser runtime is required.
- Browser print rendering reuses the already-rendered preview.
- The preview component renders lightweight icons, simple text, and metrics, avoiding heavy client-side charts or map snapshots.

## Current Limitations

- Exact pagination can vary slightly between browser print engines.
- Users must select `Save as PDF` in the browser print dialog.
- Only one report type and one audience are enabled.
- Reports are not saved to Supabase yet.
- The report does not include maps, logos, or charts.

These limitations are intentional for the first working version.
