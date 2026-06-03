import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatusBadge from "@/components/test-ui/StatusBadge";
import TestUiShell from "@/components/test-ui/TestUiShell";

export default async function TestUiWeatherPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Weather Forecast and Alerts"
      description="Prototype for weather warnings, severity cards, and feed health. This can consume live METMalaysia warnings or simulation scenarios."
      mode={mode}
      pathname="/weather"
    >
      <PageSection title="Normalized Weather Alerts">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.weatherAlerts.map((alert) => (
            <article key={alert.id} className="rounded-lg border border-border bg-panel p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-foreground/50">{alert.source}</p>
                  <h2 className="mt-2 text-base font-bold text-foreground">{alert.title}</h2>
                </div>
                <StatusBadge label={alert.severity} severity={alert.severity} />
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/65">{alert.description}</p>
              <p className="mt-4 text-xs text-foreground/50">Affected area: {alert.affectedArea}</p>
            </article>
          ))}
          {data.weatherAlerts.length === 0 ? (
            <p className="rounded-lg border border-border bg-panel p-5 text-sm text-foreground/60">
              No normalized weather alert records are available in this mode yet.
            </p>
          ) : null}
        </div>
      </PageSection>

    </TestUiShell>
  );
}
