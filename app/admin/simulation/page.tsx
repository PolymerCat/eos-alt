import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import StatCard from "@/components/test-ui/StatCard";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";

export default async function AdminSimulationPage() {
  const data = await getEmergencyData({ mode: "simulation" });

  return (
    <>
      <AdminPageHeader
        title="Simulation Data"
        description="Inspect the active simulation scenario and the records it provides to prototype pages."
      />

      <div className="rounded-lg border border-border bg-panel p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Active scenario</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">{data.scenarioName ?? "Default simulation"}</h3>
          </div>
          <AdminStatusPill label="simulated" tone="blue" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Shelters" value={data.shelters.length} detail="Scenario shelter records" mode="simulation" />
        <StatCard label="Weather Alerts" value={data.weatherAlerts.length} detail="Scenario alert records" mode="simulation" />
        <StatCard label="Notifications" value={data.notifications.length} detail="Scenario notification records" mode="simulation" />
        <StatCard label="SOS Requests" value={data.sosRequests.length} detail="Scenario SOS records" mode="simulation" />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <h3 className="font-semibold text-foreground">Import / Refresh Direction</h3>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-foreground/65">
          <p>Current simulation mode reads scenario objects through the shared provider.</p>
          <p>The next admin step is an import action that writes selected scenario records into normalized simulation tables.</p>
          <p>Until that table-backed import exists, this page verifies that scenario data is shaped correctly for the UI.</p>
        </div>
      </section>
    </>
  );
}
