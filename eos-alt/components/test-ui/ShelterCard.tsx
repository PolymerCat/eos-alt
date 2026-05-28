import type { PPS } from "@/app/actions";
import StatusBadge from "./StatusBadge";

function getCapacityLabel(capacity: string) {
  const value = Number.parseFloat(capacity);
  if (Number.isNaN(value)) return { label: "Unknown", severity: "advisory" as const };
  if (value >= 90) return { label: "Critical", severity: "critical" as const };
  if (value >= 75) return { label: "Nearly Full", severity: "warning" as const };
  if (value >= 50) return { label: "Filling", severity: "watch" as const };
  return { label: "Available", severity: "advisory" as const };
}

export default function ShelterCard({ shelter }: { shelter: PPS }) {
  const capacity = getCapacityLabel(shelter.kapasiti);

  return (
    <article className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-5 text-foreground">
            {shelter.name}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            {shelter.daerah}, {shelter.negeri}
          </p>
        </div>
        <StatusBadge label={capacity.label} severity={capacity.severity} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-foreground/50">Victims</p>
          <p className="font-semibold text-foreground">{shelter.mangsa}</p>
        </div>
        <div>
          <p className="text-xs text-foreground/50">Families</p>
          <p className="font-semibold text-foreground">{shelter.keluarga}</p>
        </div>
        <div>
          <p className="text-xs text-foreground/50">Capacity</p>
          <p className="font-semibold text-foreground">{shelter.kapasiti}</p>
        </div>
      </div>
    </article>
  );
}
