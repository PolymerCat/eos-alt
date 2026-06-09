import type { PPS } from "@/app/actions";
import type { EmergencyDataSnapshot, WeatherAlert } from "@/types/emergency";
import type { GeneratedReport, GeneratedReportShelter, ReportGenerationInput } from "@/types/reporting";
import { getShelterDisasterPresentation } from "@/lib/shelters/disaster";

const HIGH_CAPACITY_THRESHOLD = 80;
const CRITICAL_SEVERITIES = new Set<WeatherAlert["severity"]>(["critical", "warning"]);

function parseInteger(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCapacity(value: string | undefined): number {
  const normalized = value?.replace("%", "").trim() ?? "0";
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function countHighCapacityShelters(shelters: PPS[]): number {
  return shelters.filter((shelter) => parseCapacity(shelter.kapasiti) >= HIGH_CAPACITY_THRESHOLD).length;
}

function sumShelterField(shelters: PPS[], key: "mangsa" | "keluarga"): number {
  return shelters.reduce((total, shelter) => total + parseInteger(shelter[key]), 0);
}

function listAffectedAreas(alerts: WeatherAlert[]): string {
  const areas = Array.from(new Set(alerts.map((alert) => alert.affectedArea).filter(Boolean)));
  return areas.length > 0 ? areas.slice(0, 4).join(", ") : "No affected area listed";
}

function mapOnlineShelters(shelters: PPS[]): GeneratedReportShelter[] {
  return shelters
    .filter((shelter) => shelter.status !== "offline")
    .map((shelter) => ({
      id: shelter.id,
      name: shelter.name,
      state: shelter.negeri,
      district: shelter.daerah,
      latitude: shelter.latti,
      longitude: shelter.longi,
      disasterType: getShelterDisasterPresentation(shelter).label,
    }));
}

function buildShelterPoints(snapshot: EmergencyDataSnapshot): string[] {
  const onlineShelters = mapOnlineShelters(snapshot.shelters);
  const highCapacityShelters = countHighCapacityShelters(snapshot.shelters);

  if (snapshot.shelters.length === 0) {
    return ["No shelter records available in this data mode."];
  }

  return [
    `${snapshot.shelters.length} shelter record(s) reviewed`,
    `${onlineShelters.length} online shelter(s) available`,
    `${highCapacityShelters} at or above ${HIGH_CAPACITY_THRESHOLD}% capacity`,
  ];
}

function buildWeatherPoints(snapshot: EmergencyDataSnapshot): string[] {
  const importantAlerts = snapshot.weatherAlerts.filter((alert) => CRITICAL_SEVERITIES.has(alert.severity));

  if (snapshot.weatherAlerts.length === 0) {
    return ["No active weather alert records available in this data mode."];
  }

  return [
    `${snapshot.weatherAlerts.length} weather alert(s) reviewed`,
    `${importantAlerts.length} warning or critical alert(s)`,
    `Affected areas: ${listAffectedAreas(snapshot.weatherAlerts)}`,
  ];
}

function buildDataSourcePoints(snapshot: EmergencyDataSnapshot): string[] {
  if (snapshot.dataSources.length === 0) {
    return ["No data source status records available."];
  }

  return snapshot.dataSources.map((source) => `${source.name}: ${source.status} - ${source.notes}`);
}

function buildSummary(snapshot: EmergencyDataSnapshot): string {
  const highCapacityShelters = countHighCapacityShelters(snapshot.shelters);
  const importantAlerts = snapshot.weatherAlerts.filter((alert) => CRITICAL_SEVERITIES.has(alert.severity));

  if (snapshot.shelters.length === 0 && snapshot.weatherAlerts.length === 0) {
    return "No active shelter or weather alert records are available for this mode at the time of generation.";
  }

  return [
    `${snapshot.shelters.length} shelter record(s) reviewed`,
    `${snapshot.weatherAlerts.length} weather alert(s) reviewed`,
    `${highCapacityShelters} shelter(s) above high capacity`,
    `${importantAlerts.length} alert(s) need attention`,
  ].join(" ");
}

function formatMode(mode: EmergencyDataSnapshot["mode"]): string {
  return mode === "simulation" ? "Simulation" : "Live";
}

/**
 * Builds a deterministic public situation brief from the shared emergency snapshot.
 * The function is intentionally pure so UI preview and PDF export cannot drift apart.
 */
export function buildSituationBriefReport(
  snapshot: EmergencyDataSnapshot,
  input: ReportGenerationInput
): GeneratedReport {
  const generatedAt = new Date().toISOString();
  const totalVictims = sumShelterField(snapshot.shelters, "mangsa");
  const totalFamilies = sumShelterField(snapshot.shelters, "keluarga");
  const onlineShelters = mapOnlineShelters(snapshot.shelters);

  return {
    id: `report-${input.mode}-${Date.now()}`,
    title: `${formatMode(snapshot.mode)} Emergency Situation Brief`,
    summary: buildSummary(snapshot),
    generatedAt,
    mode: input.mode,
    type: input.type,
    audience: input.audience,
    metrics: [
      { label: "Shelters", value: String(snapshot.shelters.length), icon: "shelter" },
      { label: "Online", value: String(onlineShelters.length), icon: "shelter" },
      { label: "Alerts", value: String(snapshot.weatherAlerts.length), icon: "weather" },
      { label: "Victims", value: String(totalVictims), icon: "people" },
      { label: "Families", value: String(totalFamilies), icon: "people" },
    ],
    onlineShelters,
    sections: [
      {
        heading: "Shelter Status",
        icon: "shelter",
        points: buildShelterPoints(snapshot),
      },
      {
        heading: "Weather Alert Status",
        icon: "weather",
        points: buildWeatherPoints(snapshot),
      },
      {
        heading: "Data Source Status",
        icon: "database",
        points: buildDataSourcePoints(snapshot),
      },
    ],
    disclaimer:
      input.mode === "simulation"
        ? "Simulation mode: this report uses simulated emergency data for testing and demonstration. Verify critical emergency instructions with official agencies."
        : "This report is generated from Emergency OS data available at the time of generation. Verify critical emergency instructions with official agencies.",
  };
}
