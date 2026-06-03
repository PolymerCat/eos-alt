import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";
import type { AlertSeverity } from "@/types/emergency";

function severityTone(severity: AlertSeverity) {
  if (severity === "critical") return "red";
  if (severity === "warning" || severity === "watch") return "amber";
  return "blue";
}

export default async function AdminAlertsPage() {
  const data = await getEmergencyData({ mode: "live" });

  return (
    <>
      <AdminPageHeader
        title="Stored Alerts"
        description="Review stored weather alerts from the live provider. This should eventually become the admin view for historical alert records."
      />

      {data.weatherAlerts.length === 0 ? (
        <AdminEmptyState title="No stored alerts found" description="Run a live data sync or wait for active weather alerts to be stored." />
      ) : (
        <div className="grid gap-4">
          {data.weatherAlerts.map((alert) => (
            <article key={alert.id} className="rounded-lg border border-border bg-panel p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                  <p className="mt-1 text-sm text-foreground/50">{alert.source}</p>
                </div>
                <AdminStatusPill label={alert.severity} tone={severityTone(alert.severity)} />
              </div>
              <p className="mt-4 text-sm leading-6 text-foreground/65">{alert.description || "No description available."}</p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <p className="rounded-md border border-border bg-background p-3">
                  <span className="block text-xs text-foreground/45">Affected area</span>
                  <span className="mt-1 block font-medium text-foreground">{alert.affectedArea || "Not listed"}</span>
                </p>
                <p className="rounded-md border border-border bg-background p-3">
                  <span className="block text-xs text-foreground/45">Issued</span>
                  <span className="mt-1 block font-medium text-foreground">{new Date(alert.issuedAt).toLocaleString("en-MY")}</span>
                </p>
                <p className="rounded-md border border-border bg-background p-3">
                  <span className="block text-xs text-foreground/45">Valid until</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {alert.validTo ? new Date(alert.validTo).toLocaleString("en-MY") : "Open ended"}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
