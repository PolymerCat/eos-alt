# Reporting Feature Implementation Notes

## Implemented Scope

The first reporting implementation supports:

- Situation Brief report type
- Public sharing audience
- On-page report preview
- PDF download
- Live/simulation mode labels
- No report persistence yet

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

### `lib/reporting/pdf.ts`

Creates a lightweight single-page PDF Blob from a `GeneratedReport`.

For this first version, the project does not add a heavy PDF dependency. This keeps the bundle smaller and avoids extra install/network requirements. The PDF generator is intentionally simple and text-focused.

Future versions can replace this with `@react-pdf/renderer` if richer layout, pagination, tables, logos, or multi-page reports become necessary.

### `components/reports/ReportBuilder.tsx`

Client component for:

- generating a preview
- downloading the PDF
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
- PDF generation runs only when the user clicks download.
- The public report excludes private emergency contact details.
- Simulation mode is clearly labeled in the generated report and disclaimer.

## Performance Notes

- The report is built from the already-loaded snapshot, so changing report controls does not trigger another API request.
- PDF generation is deferred until download, keeping initial mobile page load lighter.
- No new PDF package was added for the first version.
- The preview component renders lightweight icons, simple text, and metrics, avoiding heavy client-side charts or map snapshots.

## Current Limitations

- PDF output is single-page and text-only.
- Only one report type and one audience are enabled.
- Reports are not saved to Supabase yet.
- The PDF does not include maps, logos, or charts.

These limitations are intentional for the first working version.
