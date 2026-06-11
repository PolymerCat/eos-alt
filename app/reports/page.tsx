import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import TestUiShell from "@/components/test-ui/TestUiShell";
import ReportBuilder from "@/components/reports/ReportBuilder";

export default async function TestUiReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Report Generation and Share Preview"
      description="Generate a public situation brief from the selected emergency data mode and save the styled preview as a PDF."
      mode={mode}
      pathname="/reports"
    >
      <ReportBuilder snapshot={data} />
    </TestUiShell>
  );
}
