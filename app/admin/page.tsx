import DataSyncButton from "@/components/DataSyncButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import StatCard from "@/components/test-ui/StatCard";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";

function countOnlineShelters(shelters: Array<{ status?: string }>): number {
  return shelters.filter((shelter) => shelter.status !== "offline").length;
}

export default async function AdminOverviewPage() {
  const data = await getEmergencyData({ mode: "live" });
  const onlineShelters = countOnlineShelters(data.shelters);
  const degradedSources = data.dataSources.filter((source) => source.status === "degraded" || source.status === "offline");
  const criticalAlerts = data.weatherAlerts.filter((alert) => alert.severity === "critical" || alert.severity === "warning");

  return (
    <>
      <AdminPageHeader
        title="Operations Overview"
        description="Monitor live emergency data, source health, active shelter records, and stored alert readiness from one admin surface."
        actions={<DataSyncButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Shelters" value={data.shelters.length} detail={`${onlineShelters} online in latest snapshot`} mode="live" />
        <StatCard label="Weather Alerts" value={data.weatherAlerts.length} detail={`${criticalAlerts.length} warning or critical`} mode="live" />
        <StatCard label="Data Sources" value={data.dataSources.length} detail={`${degradedSources.length} degraded/offline`} mode="live" />
        <StatCard label="SOS Requests" value={data.sosRequests.length} detail="Recent user-owned records visible to provider" mode="live" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-panel p-4 shadow-sm sm:p-5">
          <h3 className="font-semibold text-foreground">Data Source Health</h3>
          <div className="mt-4 grid gap-3">
            {data.dataSources.map((source) => (
              <article key={source.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex min-w-0 flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground [overflow-wrap:anywhere]">{source.name}</h4>
                    <p className="mt-1 text-sm leading-6 text-foreground/60">{source.notes}</p>
                  </div>
                  <AdminStatusPill label={source.status} tone={source.status === "online" ? "green" : "amber"} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-panel p-4 shadow-sm sm:p-5">
          <h3 className="font-semibold text-foreground">Recent Alert Snapshot</h3>
          <div className="mt-4 grid gap-3">
            {data.weatherAlerts.slice(0, 4).map((alert) => (
              <article key={alert.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex min-w-0 flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground [overflow-wrap:anywhere]">{alert.title}</h4>
                    <p className="mt-1 text-sm text-foreground/60 [overflow-wrap:anywhere]">{alert.affectedArea || "No affected area listed"}</p>
                  </div>
                  <AdminStatusPill label={alert.severity} tone={alert.severity === "critical" ? "red" : "amber"} />
                </div>
              </article>
            ))}
            {data.weatherAlerts.length === 0 ? (
              <p className="rounded-md border border-border bg-background p-4 text-sm text-foreground/60">
                No stored weather alerts are available in the live provider.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
