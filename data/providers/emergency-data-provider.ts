import type { DataMode, EmergencyDataSnapshot } from "@/types/emergency";
import { getLiveEmergencyData } from "./live-provider";
import { getSimulationEmergencyData } from "./simulation-provider";

interface EmergencyDataOptions {
  mode?: DataMode;
  scenarioId?: string;
}

export function normalizeDataMode(value?: string | string[]): DataMode {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === "live" ? "live" : "simulation";
}

export async function getEmergencyData(
  options: EmergencyDataOptions = {}
): Promise<EmergencyDataSnapshot> {
  const mode = options.mode ?? "simulation";

  if (mode === "live") {
    return getLiveEmergencyData();
  }

  return getSimulationEmergencyData(options.scenarioId);
}
