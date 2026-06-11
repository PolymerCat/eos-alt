"use client";

import { useMemo, useState } from "react";
import { FileText, Printer, RefreshCw } from "lucide-react";
import type { EmergencyDataSnapshot } from "@/types/emergency";
import type { GeneratedReport } from "@/types/reporting";
import { buildSituationBriefReport } from "@/lib/reporting/build-report";
import PageSection from "@/components/test-ui/PageSection";
import ReportPreview from "@/components/reports/ReportPreview";

interface ReportBuilderProps {
  snapshot: EmergencyDataSnapshot;
}

export default function ReportBuilder({ snapshot }: ReportBuilderProps) {
  const [report, setReport] = useState<GeneratedReport | null>(null);

  const canGenerate = useMemo(
    () => snapshot.shelters.length > 0 || snapshot.weatherAlerts.length > 0 || snapshot.savedLocations.length > 0,
    [snapshot.savedLocations.length, snapshot.shelters.length, snapshot.weatherAlerts.length]
  );

  function generatePreview() {
    setReport(
      buildSituationBriefReport(snapshot, {
        mode: snapshot.mode,
        type: "situation_brief",
        audience: "public",
      })
    );
  }

  function printPdf() {
    if (!report) return;
    window.print();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <PageSection title="Report Builder">
        <div className="rounded-lg border border-border bg-panel p-5 shadow-sm">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground">Report type</span>
              <select
                value="situation_brief"
                disabled
                className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-80"
              >
                <option value="situation_brief">Situation brief</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground">Audience</span>
              <select
                value="public"
                disabled
                className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-80"
              >
                <option value="public">Public sharing</option>
              </select>
            </label>

            <div className="rounded-md border border-border bg-background p-3 text-sm leading-6 text-foreground/65">
              The first reporting scope uses the current {snapshot.mode} data snapshot and excludes private contact
              details from the public PDF.
            </div>

            <button
              type="button"
              onClick={generatePreview}
              disabled={!canGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {report ? <RefreshCw className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {report ? "Regenerate Preview" : "Generate Preview"}
            </button>

            <button
              type="button"
              onClick={printPdf}
              disabled={!report}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </PageSection>

      <PageSection title="Shareable Preview">
        {report ? (
          <ReportPreview report={report} />
        ) : (
          <p className="rounded-lg border border-border bg-panel p-5 text-sm text-foreground/60">
            Generate a preview to review the public situation brief before downloading the PDF.
          </p>
        )}
      </PageSection>
    </div>
  );
}
