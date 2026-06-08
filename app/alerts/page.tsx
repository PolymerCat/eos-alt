import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import TestUiShell from "@/components/test-ui/TestUiShell";
import AlertsTabsView from "./AlertsTabsView";

export default async function TestUiAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Personalized Alerts and Notifications"
      description="Prototype for matching warnings against saved locations and user alert preferences."
      mode={mode}
      pathname="/alerts"
    >
      <AlertsTabsView
        savedLocations={data.savedLocations}
        notifications={data.notifications}
        weatherAlerts={data.weatherAlerts}
      />
    </TestUiShell>
  );
}
