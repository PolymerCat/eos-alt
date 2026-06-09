import type { PPS } from "@/app/actions";

export type DisasterCategory =
  | "flood"
  | "landslide"
  | "storm"
  | "fire"
  | "haze"
  | "earthquake"
  | "other"
  | "unavailable"
  | "inactive";

export interface DisasterPresentation {
  category: DisasterCategory;
  label: string;
  rawLabel: string | null;
  isActive: boolean;
}

const DISASTER_LABELS: Array<{
  category: Exclude<DisasterCategory, "other" | "unavailable" | "inactive">;
  label: string;
  terms: string[];
}> = [
  { category: "flood", label: "Flood", terms: ["BANJIR", "FLOOD"] },
  { category: "landslide", label: "Landslide", terms: ["TANAH RUNTUH", "LANDSLIDE"] },
  { category: "storm", label: "Storm", terms: ["RIBUT", "STORM", "TYPHOON"] },
  { category: "fire", label: "Fire", terms: ["KEBAKARAN", "FIRE"] },
  { category: "haze", label: "Haze", terms: ["JEREBU", "HAZE"] },
  { category: "earthquake", label: "Earthquake", terms: ["GEMPA BUMI", "EARTHQUAKE"] },
];

function normalizeRawDisaster(value?: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ").toUpperCase();
  return normalized || null;
}

/**
 * Returns the current activation state while preserving support for legacy PPS
 * records that only expose the older online/offline status field.
 */
export function getShelterOperationalStatus(
  shelter: Pick<PPS, "operationalStatus" | "status">
): "active" | "inactive" | "unknown" {
  if (shelter.operationalStatus) return shelter.operationalStatus;
  if (shelter.status === "offline") return "inactive";
  if (shelter.status) return "active";
  return "unknown";
}

/**
 * Converts raw JKM disaster text into consistent user-facing copy without
 * discarding unknown upstream values.
 */
export function getShelterDisasterPresentation(
  shelter: Pick<PPS, "disasterType" | "bencana" | "operationalStatus" | "status">
): DisasterPresentation {
  const operationalStatus = getShelterOperationalStatus(shelter);
  return getDisasterPresentation(
    shelter.disasterType ?? shelter.bencana,
    operationalStatus
  );
}

/**
 * Normalizes an upstream disaster value when a complete shelter record is not
 * available, such as while composing saved-location notifications.
 */
export function getDisasterPresentation(
  rawValue?: string | null,
  operationalStatus: "active" | "inactive" | "unknown" = "active"
): DisasterPresentation {
  if (operationalStatus === "inactive") {
    return {
      category: "inactive",
      label: "No active emergency",
      rawLabel: null,
      isActive: false,
    };
  }

  const rawLabel = normalizeRawDisaster(rawValue);
  if (!rawLabel) {
    return {
      category: "unavailable",
      label: "Emergency type unavailable",
      rawLabel: null,
      isActive: operationalStatus === "active",
    };
  }

  const known = DISASTER_LABELS.find((item) =>
    item.terms.some((term) => rawLabel.includes(term))
  );

  return {
    category: known?.category ?? "other",
    label: known?.label ?? rawLabel,
    rawLabel,
    isActive: operationalStatus === "active",
  };
}
