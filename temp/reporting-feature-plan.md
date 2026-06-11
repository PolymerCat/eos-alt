# Reporting Feature Plan

## Goal

Build a PDF-only reporting feature that lets a user generate a shareable emergency situation report from the same data system used by the dashboard, map, alerts, SOS, and simulation mode.

The report feature should not become a separate static-data path. It should read from the shared emergency data provider so live mode and simulation mode stay aligned.

## Current Implementation

The current report page is:

```txt
app/test-ui/reports/page.tsx
```

It currently:

- reads `mode` from the route query string
- calls `getEmergencyData({ mode })`
- reads the first report from `data.reports[0]`
- renders a simple report builder form
- renders a preview if the selected mode already contains report records

The current limitation is that the form does not actually generate anything. In live mode, `data.providers/live-provider.ts` returns:

```ts
reports: []
```

So the live report page cannot produce a meaningful report yet.

## Relevant Design Alignment

From the diagrams and project notes in `temp`:

- The module diagram includes `Report Generation and Shareable Preview`.
- The user use-case diagram includes `Generate Report` and `Share Report`.
- The class diagram includes `SharePreview`, with generated URL/message style behavior.
- The architecture diagram places feature pages in the frontend, backed by server actions/services and Supabase.
- The ERD does not currently include a report table, but the current data-system direction already recommends adding `reports`.

This means the feature should be treated as a real user-facing module, not only a visual test page.

## Recommended User Flow

```txt
User opens Reports page
  -> selects report type
  -> selects audience
  -> optionally selects area / saved location
  -> clicks Generate Preview
  -> system builds report from EmergencyDataSnapshot
  -> user reviews structured preview
  -> user clicks Download PDF
  -> PDF is generated and downloaded
```

For now, sharing to other platforms should be handled by the downloaded PDF file. Platform-specific sharing can come later.

## Report Types

Start with three report types because they match the current page and available data:

1. Situation Brief
   - high-level emergency summary
   - active shelters
   - weather alerts
   - saved-location relevance
   - data source status

2. Shelter Capacity Report
   - shelter count
   - online/offline shelter status
   - high-capacity shelters
   - victims/families count where available
   - recommended shelter notes

3. Saved Location Alert Summary
   - user saved locations
   - matching weather alerts
   - nearby shelter summary
   - latest notifications

Do not start with too many report types. These three cover the main system modules without overbuilding.

## Report Audiences

Keep the current audience choices:

- Public sharing
- Family update
- Operations team

The audience should affect wording and detail level:

- Public sharing: concise, avoids personal contact/location details.
- Family update: includes saved location names and practical safety notes.
- Operations team: includes more structured shelter, alert, and data-source details.

## Data Source

The report generator should consume:

```ts
EmergencyDataSnapshot
```

from:

```txt
data/providers/emergency-data-provider.ts
```

This keeps reports compatible with:

- live mode
- simulation mode
- future database-backed historical mode

The report page should not import from:

```txt
data/mock/emergency-scenarios.ts
```

directly.

## Proposed Files

### `types/reporting.ts`

Add report-specific types that describe the generation input and generated output.

Suggested types:

```ts
export type ReportType =
  | "situation_brief"
  | "shelter_capacity"
  | "saved_location_alert_summary";

export type ReportAudience =
  | "public"
  | "family"
  | "operations";

export interface ReportGenerationInput {
  mode: DataMode;
  type: ReportType;
  audience: ReportAudience;
  locationId?: number;
}

export interface GeneratedReport {
  id: string;
  title: string;
  summary: string;
  generatedAt: string;
  mode: DataMode;
  type: ReportType;
  audience: ReportAudience;
  sections: Array<{
    heading: string;
    body: string;
  }>;
}
```

Keep this separate from `types/emergency.ts` so emergency data contracts do not become too UI/report-specific.

### `lib/reporting/build-report.ts`

Pure report generation logic.

Responsibilities:

- accept `EmergencyDataSnapshot` and `ReportGenerationInput`
- calculate report stats
- produce a `GeneratedReport`
- contain no React code
- contain no Supabase code
- be easy to unit test later

This should be the core reporting brain.

### `lib/reporting/report-pdf.ts`

PDF generation utilities.

Recommended first implementation:

- use `@react-pdf/renderer`
- create a PDF document component from `GeneratedReport`
- keep styling simple and readable
- include generation timestamp and mode label

Why this approach:

- PDF output is deterministic.
- It does not require browser print behavior.
- It can run from React/Next cleanly.
- It keeps future branded PDF layout maintainable.

Alternative:

- browser `window.print()` with print CSS.

Do not use this as the primary approach because the output depends heavily on browser settings and is harder to control.

### Implemented PDF Direction

The implementation now uses browser print-to-PDF because matching the on-page
preview became the higher priority. `ReportPreview` is the single visual report
layout, with dedicated A4 print CSS. This removes the separate plain-text PDF
renderer and prevents visual drift between preview and output.

### `components/reports/ReportBuilder.tsx`

Client component for the form.

Responsibilities:

- report type selection
- audience selection
- saved-location selection when relevant
- generate preview action
- download PDF action
- loading/error states

It should receive initial data from the server page rather than fetching the whole snapshot again on the client.

### `components/reports/ReportPreview.tsx`

Reusable preview component.

Responsibilities:

- display title, summary, timestamp, sections
- show mode label
- show report type/audience

This component should render the same `GeneratedReport` object that PDF generation receives. That prevents preview/PDF mismatch.

### `app/test-ui/reports/page.tsx`

Update this page to:

- load `EmergencyDataSnapshot`
- pass data into `ReportBuilder`
- keep `TestUiShell` and mode switching behavior

This page should remain the prototype route for the reporting experience.

### Future Production Route

After the test UI works, the same components can be moved or reused in:

```txt
app/reports/page.tsx
```

## Server Action Plan

For the first version, avoid saving generated reports to Supabase.

Reason:

- the immediate user goal is PDF generation and sharing
- saving report history adds schema, RLS, cleanup, and storage decisions
- the current live provider does not yet return persisted reports

Recommended first version:

```txt
server page loads snapshot
  -> client builder generates report preview from provided snapshot
  -> client downloads PDF
```

If report generation grows heavier later:

```txt
client submits report options
  -> server action loads snapshot
  -> server action builds report
  -> returns GeneratedReport
```

## Database Plan

Do not block the first implementation on a database table.

When persistence is needed, add a `reports` table:

```sql
reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mode text not null,
  report_type text not null,
  audience text not null,
  title text not null,
  summary text not null,
  sections jsonb not null,
  source_snapshot jsonb,
  created_at timestamptz default now()
)
```

Enable RLS:

```sql
auth.uid() = user_id
```

Only store generated PDF files in Supabase Storage later if users need to retrieve old PDFs. Otherwise, storing structured report JSON is enough because PDFs can be regenerated.

## PDF Contents

Every PDF should include:

- title
- generated date/time
- mode: live or simulation
- audience
- report type
- short summary
- sections
- data source status
- disclaimer

Recommended disclaimer:

```txt
This report is generated from Emergency OS data available at the time of generation. Verify critical emergency instructions with official agencies.
```

For simulation mode, include:

```txt
Simulation mode: this report uses simulated emergency data for testing and demonstration.
```

## Data Calculations

Start with deterministic calculations:

- total shelters
- online shelters
- offline shelters
- shelters above 80% capacity
- total victims
- total families
- active weather alerts
- critical weather alerts
- saved locations count
- latest SOS request status
- latest notification status

Do not use AI-generated prose for the first version. Template-based text is easier to verify and safer for emergency contexts.

## Component Behavior

The report builder should:

- disable `Download PDF` until a preview exists
- show clear loading state during PDF generation
- show an error if the snapshot has no usable data
- visibly label simulation mode
- keep controls compact and not clutter the page

The preview should:

- stay readable on mobile
- avoid nested cards
- use sections with clear headings
- match the PDF sections closely

## Performance Notes

- Build report content from the already-loaded snapshot.
- Use `useMemo` for derived report preview if generated entirely client-side.
- Do not refetch live APIs when only changing audience/type.
- Avoid storing large PDF blobs in React state.
- Generate the PDF only when the user clicks download, not every time form fields change.
- Keep source snapshot JSON out of the client if report persistence is not needed.

## Security and Privacy Notes

- Public reports should not include emergency contacts, phone numbers, or exact saved-location coordinates.
- Family reports can include saved-location labels, but avoid exposing full private details unless the user explicitly chooses that later.
- Operations reports can include more detail, but still should not expose personal contact numbers by default.
- Generated PDFs should clearly label simulation/live mode.

## Implementation Phases

### Phase 1: PDF Prototype

1. Add report types in `types/reporting.ts`.
2. Add pure report builder in `lib/reporting/build-report.ts`.
3. Add `ReportBuilder` and `ReportPreview` components.
4. Use `@react-pdf/renderer` for download-only PDF output.
5. Wire `/test-ui/reports` to generate preview and download PDF.

### Phase 2: Better Report Content

1. Add saved-location filtering.
2. Add more precise shelter distance calculations.
3. Include active weather forecast summaries.
4. Include recent notification/SOS status in family and operations reports.

### Phase 3: Persistence

1. Add `reports` table.
2. Save generated report JSON.
3. Show report history.
4. Optionally regenerate PDF from saved report JSON.

### Phase 4: Production Integration

1. Move or reuse the test UI components in a production `/reports` page.
2. Add navigation entry only if the reporting page is considered user-facing.
3. Add role-specific operations/admin report variants later.

## Recommended First Build Scope

For the next implementation step, build only:

- `Situation Brief`
- `Public sharing`
- PDF download
- simulation/live mode labels
- generated preview

Then expand to shelter and saved-location reports after the base pipeline works.

This keeps the first version small while proving the important architecture: one report object can render both on screen and as a PDF.
