import type { PPS } from "@/app/actions";
import { getShelterDisasterPresentation, type DisasterCategory } from "@/lib/shelters/disaster";
import { cn } from "@/utils/tw-utils";

const categoryClasses: Record<DisasterCategory, string> = {
  flood: "border-blue-300 bg-blue-50 text-blue-800",
  landslide: "border-amber-300 bg-amber-50 text-amber-900",
  storm: "border-violet-300 bg-violet-50 text-violet-800",
  fire: "border-red-300 bg-red-50 text-red-800",
  haze: "border-orange-300 bg-orange-50 text-orange-900",
  earthquake: "border-rose-300 bg-rose-50 text-rose-800",
  other: "border-slate-300 bg-slate-50 text-slate-800",
  unavailable: "border-slate-300 bg-slate-50 text-slate-600",
  inactive: "border-slate-300 bg-slate-100 text-slate-500",
};

/**
 * Shared disaster badge used across shelter surfaces so unknown, missing, and
 * inactive emergency states are presented consistently.
 */
export default function DisasterBadge({
  shelter,
  className,
}: {
  shelter: Pick<PPS, "disasterType" | "bencana" | "operationalStatus" | "status">;
  className?: string;
}) {
  const disaster = getShelterDisasterPresentation(shelter);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-1 text-xs font-semibold",
        categoryClasses[disaster.category],
        className
      )}
      title={disaster.rawLabel && disaster.rawLabel !== disaster.label ? disaster.rawLabel : undefined}
    >
      <span className="truncate">{disaster.label}</span>
    </span>
  );
}

