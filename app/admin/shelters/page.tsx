import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import StatCard from "@/components/test-ui/StatCard";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";

const SHELTER_RENDER_LIMIT = 120;

function parseCapacity(value: string): number {
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function AdminSheltersPage() {
  const data = await getEmergencyData({ mode: "live" });
  const sortedShelters = [...data.shelters].sort((left, right) => {
    if ((left.status ?? "online") !== (right.status ?? "online")) {
      return left.status === "offline" ? 1 : -1;
    }
    return right.mangsa.localeCompare(left.mangsa, undefined, { numeric: true });
  });
  const visibleShelters = sortedShelters.slice(0, SHELTER_RENDER_LIMIT);
  const onlineCount = data.shelters.filter((shelter) => shelter.status !== "offline").length;
  const highCapacityCount = data.shelters.filter((shelter) => parseCapacity(shelter.kapasiti) >= 80).length;

  return (
    <>
      <AdminPageHeader
        title="Shelter Monitoring"
        description="Inspect saved shelter records and their latest online/offline status from live shelter snapshots."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Shelters" value={data.shelters.length} detail="Saved shelter records" mode="live" />
        <StatCard label="Online" value={onlineCount} detail="Present in latest active feed" mode="live" />
        <StatCard label="High Capacity" value={highCapacityCount} detail="At or above 80%" mode="live" />
      </div>

      <div className="mt-6">
        {visibleShelters.length === 0 ? (
          <AdminEmptyState title="No shelters found" description="Run a live data sync or verify that the shelters table has records." />
        ) : (
          <div className="grid gap-3">
            {visibleShelters.map((shelter) => {
              const isOnline = shelter.status !== "offline";

              return (
                <article key={shelter.id} className="rounded-lg border border-border bg-panel p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{shelter.name}</h3>
                      <p className="mt-1 text-sm text-foreground/60">
                        {shelter.negeri} / {shelter.daerah}
                      </p>
                      <p className="mt-2 text-xs font-medium text-foreground/45">
                        {shelter.latti}, {shelter.longi}
                      </p>
                    </div>
                    <AdminStatusPill label={isOnline ? "online" : "offline"} tone={isOnline ? "green" : "gray"} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-xs text-foreground/45">Victims</p>
                      <p className="mt-1 font-semibold text-foreground">{shelter.mangsa}</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-xs text-foreground/45">Families</p>
                      <p className="mt-1 font-semibold text-foreground">{shelter.keluarga}</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-xs text-foreground/45">Capacity</p>
                      <p className="mt-1 font-semibold text-foreground">{shelter.kapasiti}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {data.shelters.length > SHELTER_RENDER_LIMIT ? (
          <p className="mt-4 rounded-md border border-border bg-panel p-3 text-sm text-foreground/60">
            Showing {SHELTER_RENDER_LIMIT} of {data.shelters.length} shelters to keep the admin page responsive on mobile.
          </p>
        ) : null}
      </div>
    </>
  );
}
