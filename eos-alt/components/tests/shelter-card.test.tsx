import React from 'react';
import { MapPin, Navigation } from "lucide-react";
import { PPS } from '@/app/actions';
import { cn } from "@/utils/tw-utils";

interface CardProps {
  ppsData: PPS;
  onShelterClick: (pps: PPS) => void;
  selectedShelter: boolean;
}

const capacityBarColor: Record<string, string> = {
  low: "bg-[var(--capacity-low)]",
  medium: "bg-[var(--capacity-medium)]",
  high: "bg-[var(--capacity-high)]",
  critical: "bg-[var(--capacity-critical)]",
};
const capacityTextColor: Record<string, string> = {
  low: "text-[var(--capacity-low)]",
  medium: "text-[var(--capacity-medium)]",
  high: "text-[var(--capacity-high)]",
  critical: "text-[var(--capacity-critical)]",
};
const capacityBadgeBg: Record<string, string> = {
  low: "bg-[color-mix(in_srgb,var(--capacity-low)_15%,transparent)]",
  medium: "bg-[color-mix(in_srgb,var(--capacity-medium)_15%,transparent)]",
  high: "bg-[color-mix(in_srgb,var(--capacity-high)_15%,transparent)]",
  critical: "bg-[color-mix(in_srgb,var(--capacity-critical)_15%,transparent)]",
};

type CapacityStatus = "low" | "medium" | "high" | "critical";
function getCapacityStatus(pct: number): CapacityStatus {
  if (pct < 50) return "low";
  if (pct < 75) return "medium";
  if (pct < 90) return "high";
  return "critical";
}
const capacityLabels: Record<CapacityStatus, string> = {
  low: "Available",
  medium: "Filling Up",
  high: "Nearly Full",
  critical: "Critical",
};

export default function ShelterCard({ ppsData, selectedShelter, onShelterClick }: CardProps) {

    const status = getCapacityStatus(parseFloat(ppsData.kapasiti.replace("%", "")));
    const label = capacityLabels[status];

    return (
        <button
      onClick={() => onShelterClick(ppsData)}
      aria-pressed={selectedShelter}
      aria-label={`${ppsData.name}, ${ppsData.daerah}, ${ppsData.negeri}. Capacity ${ppsData.kapasiti}. ${label}.`}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-colors duration-150 border-b border-border",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selectedShelter && "bg-accent"
      )}
    >
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={cn(
            "font-semibold text-sm leading-snug text-foreground",
            selectedShelter && "text-primary"
          )}
        >
          {ppsData.name}
        </span>
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full leading-tight",
            capacityTextColor[status],
            capacityBadgeBg[status]
          )}
        >
          {label}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2.5">
        <MapPin size={11} className="shrink-0" />
        <span>
          {ppsData.daerah}, {ppsData.negeri}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground font-medium">
            Capacity
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tabular-nums",
              capacityTextColor[status]
            )}
          >
            {ppsData.kapasiti}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              capacityBarColor[status]
            )}
            style={{ width: `${ppsData.kapasiti}` }}
            role="progressbar"
            aria-valuenow={parseFloat(ppsData.kapasiti)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Coordinates + last updated */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Navigation size={10} className="shrink-0" />
          <span className="text-[11px] font-mono tabular-nums">
            {parseFloat(ppsData.latti).toFixed(4)},{" "}
            {parseFloat(ppsData.longi).toFixed(4)}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {/* {ppsData.lastUpdated} */}
        </span>
      </div>
    </button>
    )
}