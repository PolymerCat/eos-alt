import DataSyncButton from "@/components/DataSyncButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";

function getSourceTone(status: string) {
  if (status === "online") return "green";
  if (status === "simulated") return "blue";
  if (status === "offline") return "red";
  return "amber";
}

export default async function AdminDataSourcesPage() {
  const data = await getEmergencyData({ mode: "live" });

  return (
    <>
      <AdminPageHeader
        title="Data Source Status"
        description="Review the external API, database, and sync-source health that feeds the public emergency UI."
        actions={<DataSyncButton />}
      />

      <div className="grid gap-4">
        {data.dataSources.map((source) => (
          <article key={source.id} className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{source.name}</h3>
                <p className="mt-1 text-sm capitalize text-foreground/50">{source.type.replace("_", " ")}</p>
              </div>
              <AdminStatusPill label={source.status} tone={getSourceTone(source.status)} />
            </div>
            <p className="mt-4 text-sm leading-6 text-foreground/65">{source.notes}</p>
            <p className="mt-3 text-xs font-medium text-foreground/45">
              Last checked: {new Date(source.lastCheckedAt).toLocaleString("en-MY")}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
