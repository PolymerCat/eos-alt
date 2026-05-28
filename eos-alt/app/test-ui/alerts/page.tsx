import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatusBadge from "@/components/test-ui/StatusBadge";
import TestUiShell from "@/components/test-ui/TestUiShell";

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
      pathname="/test-ui/alerts"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PageSection title="Saved Locations">
          <div className="flex flex-col gap-3">
            {data.savedLocations.map((location) => (
              <article key={location.id} className="rounded-lg border border-border bg-panel p-4">
                <h2 className="font-semibold text-foreground">{location.label}</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  {location.districtName}, {location.stateName}
                </p>
                <p className="mt-3 text-xs font-mono text-foreground/50">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection title="Preferences">
          <div className="flex flex-col gap-3">
            {data.alertPreferences.map((preference) => (
              <article key={preference.id} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold capitalize text-foreground">
                    {preference.alertType.replaceAll("_", " ")}
                  </h2>
                  <StatusBadge label={preference.isEnabled ? "Enabled" : "Disabled"} />
                </div>
                <p className="mt-2 text-sm text-foreground/60">
                  Channels: {preference.deliveryMethods.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection title="Notification History">
          <div className="flex flex-col gap-3">
            {data.notifications.map((notification) => (
              <article key={notification.id} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-foreground">{notification.title}</h2>
                  <StatusBadge label={notification.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/65">{notification.message}</p>
                <p className="mt-3 text-xs text-foreground/50">Via {notification.deliveryMethod}</p>
              </article>
            ))}
          </div>
        </PageSection>
      </div>
    </TestUiShell>
  );
}
