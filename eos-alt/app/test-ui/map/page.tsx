import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import TestUiShell from "@/components/test-ui/TestUiShell";
import InteractiveMapLayout from "@/components/test-ui/InteractiveMapLayout";

export default async function TestUiMapPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Interactive Emergency Map"
      description="Prototype for the full-screen map experience: shelter panel, map overlays, weather widget, selected shelter detail, and nearest shelter action."
      mode={mode}
      pathname="/test-ui/map"
    >
      <InteractiveMapLayout
        shelters={data.shelters}
        weatherAlertsCount={data.weatherAlerts.length}
      />
    </TestUiShell>
  );
}
