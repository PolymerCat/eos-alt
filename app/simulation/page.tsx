"use client";

import { useState, useEffect } from "react";
import { uploadSimulationScenario, getAllSimulationScenarios, activateSimulationScenario } from "@/app/profile/sim-actions";
import { defaultScenario } from "@/data/mock/emergency-scenarios";
import type { AlertSeverity, EmergencyScenario, WeatherAlert } from "@/types/emergency";
import type { EmergencyTimelineEvent, TimelineEventType } from "@/types/timeline";
import type { PPS, WeatherForecast } from "@/app/actions";
import * as XLSX from "xlsx";

type SpreadsheetRow = Record<string, unknown>;

interface SimulationScenarioSummary {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

const TIMELINE_EVENT_TYPES: TimelineEventType[] = [
  "shelter_opened",
  "shelter_closed",
  "shelter_capacity_changed",
  "weather_alert_issued",
  "weather_alert_expired",
];

const timelineEventTypeSet = new Set<string>(TIMELINE_EVENT_TYPES);
const alertSeveritySet = new Set<AlertSeverity>([
  "advisory",
  "watch",
  "warning",
  "critical",
]);
const weatherAlertSourceSet = new Set<WeatherAlert["source"]>([
  "METMalaysia",
  "NADMA",
  "simulation",
]);

function readText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function requireText(value: unknown, sheet: string, rowNumber: number, field: string): string {
  const text = readText(value);
  if (!text) {
    throw new Error(`${sheet} row ${rowNumber}: ${field} is required.`);
  }
  return text;
}

function parseJsonObject(
  value: unknown,
  sheet: string,
  rowNumber: number,
  field: string
): Record<string, unknown> {
  if (value === null || value === undefined || value === "") return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(String(value)) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`${field} must be a JSON object.`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${sheet} row ${rowNumber}: ${field} must contain a valid JSON object.`);
  }
}

function parseMetadata(value: unknown, rowNumber: number): Record<string, unknown> {
  return parseJsonObject(value, "TimelineEvents", rowNumber, "metadata");
}

function parseShelters(rows: SpreadsheetRow[]): PPS[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const operationalStatus = readOptionalText(row.operationalStatus);

    if (
      operationalStatus &&
      !["active", "inactive", "unknown"].includes(operationalStatus)
    ) {
      throw new Error(
        `Shelters row ${rowNumber}: operationalStatus must be active, inactive, or unknown.`
      );
    }

    return {
      id: requireText(row.id, "Shelters", rowNumber, "id"),
      name: requireText(row.name, "Shelters", rowNumber, "name"),
      latti: requireText(row.latti, "Shelters", rowNumber, "latti"),
      longi: requireText(row.longi, "Shelters", rowNumber, "longi"),
      negeri: requireText(row.negeri, "Shelters", rowNumber, "negeri"),
      daerah: requireText(row.daerah, "Shelters", rowNumber, "daerah"),
      mukim: readText(row.mukim),
      bencana: readText(row.bencana),
      disasterType: readOptionalText(row.disasterType),
      mangsa: readText(row.mangsa) || "0",
      keluarga: readText(row.keluarga) || "0",
      kapasiti: readText(row.kapasiti) || "0.00%",
      // The old workbook did not include status, so active is the compatibility default.
      status: readText(row.status) || "active",
      operationalStatus: operationalStatus as PPS["operationalStatus"],
      lastUpdatedAt: readOptionalText(row.lastUpdatedAt),
    };
  });
}

function parseWeatherAlerts(rows: SpreadsheetRow[]): WeatherAlert[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const source = readText(row.source) || "simulation";
    const severity = readText(row.severity);
    const issuedAt = requireText(row.issuedAt, "WeatherAlerts", rowNumber, "issuedAt");

    if (!weatherAlertSourceSet.has(source as WeatherAlert["source"])) {
      throw new Error(
        `WeatherAlerts row ${rowNumber}: source must be METMalaysia, NADMA, or simulation.`
      );
    }
    if (!alertSeveritySet.has(severity as AlertSeverity)) {
      throw new Error(
        `WeatherAlerts row ${rowNumber}: severity must be advisory, watch, warning, or critical.`
      );
    }
    if (!isValidDate(issuedAt)) {
      throw new Error(`WeatherAlerts row ${rowNumber}: issuedAt must be a valid date and time.`);
    }

    return {
      id: requireText(row.id, "WeatherAlerts", rowNumber, "id"),
      source: source as WeatherAlert["source"],
      title: requireText(row.title, "WeatherAlerts", rowNumber, "title"),
      titleBm: readOptionalText(row.titleBm),
      description: readText(row.description),
      descriptionBm: readOptionalText(row.descriptionBm),
      severity: severity as AlertSeverity,
      affectedArea: requireText(row.affectedArea, "WeatherAlerts", rowNumber, "affectedArea"),
      issuedAt: new Date(issuedAt).toISOString(),
      validFrom: readOptionalText(row.validFrom),
      validTo: readOptionalText(row.validTo),
    };
  });
}

function parseWeatherForecasts(rows: SpreadsheetRow[]): WeatherForecast[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    return {
      code: requireText(row.code, "Forecasts", rowNumber, "code"),
      station: requireText(row.station, "Forecasts", rowNumber, "station"),
      timestamp: requireText(row.timestamp, "Forecasts", rowNumber, "timestamp"),
      temp: requireText(row.temp, "Forecasts", rowNumber, "temp"),
      state: requireText(row.state, "Forecasts", rowNumber, "state"),
      rainfall: parseJsonObject(row.rainfall, "Forecasts", rowNumber, "rainfall") as Record<string, string>,
      icon: requireText(row.icon, "Forecasts", rowNumber, "icon"),
    };
  });
}

/**
 * Converts the optional TimelineEvents worksheet into the same immutable event
 * contract used by the live timeline. Validation at this import boundary keeps
 * malformed custom history out of timeline providers and presentation code.
 */
function parseTimelineEvents(rows: SpreadsheetRow[]): EmergencyTimelineEvent[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const eventType = readText(row.eventType);
    const occurredAt = readText(row.occurredAt);
    const endedAt = readOptionalText(row.endedAt);
    const title = readText(row.title);

    if (!timelineEventTypeSet.has(eventType)) {
      throw new Error(
        `TimelineEvents row ${rowNumber}: eventType must be one of ${TIMELINE_EVENT_TYPES.join(", ")}.`
      );
    }
    if (!occurredAt || !isValidDate(occurredAt)) {
      throw new Error(
        `TimelineEvents row ${rowNumber}: occurredAt must be a valid date and time.`
      );
    }
    if (endedAt && !isValidDate(endedAt)) {
      throw new Error(
        `TimelineEvents row ${rowNumber}: endedAt must be a valid date and time.`
      );
    }
    if (!title) {
      throw new Error(`TimelineEvents row ${rowNumber}: title is required.`);
    }

    return {
      id: readOptionalText(row.id) ?? `simulation-event-${Date.now()}-${index + 1}`,
      eventType: eventType as TimelineEventType,
      occurredAt: new Date(occurredAt).toISOString(),
      endedAt: endedAt ? new Date(endedAt).toISOString() : undefined,
      shelterId: readOptionalText(row.shelterId),
      weatherAlertId: readOptionalText(row.weatherAlertId),
      disasterType: readOptionalText(row.disasterType),
      state: readOptionalText(row.state),
      district: readOptionalText(row.district),
      title,
      description: readOptionalText(row.description),
      source: readOptionalText(row.source) ?? "simulation",
      metadata: parseMetadata(row.metadata, rowNumber),
    };
  });
}

function rowsFromRecords(
  records: object[],
  headers: string[],
  serializeObjects = false
): unknown[][] {
  return records.map((record) => {
    const values = record as Record<string, unknown>;
    return headers.map((header) => {
      const value = values[header];
      if (serializeObjects && typeof value === "object" && value !== null) {
        return JSON.stringify(value ?? {});
      }
      return value ?? "";
    });
  });
}

export default function SimulationDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [scenarios, setScenarios] = useState<SimulationScenarioSummary[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);

  const fetchScenarios = async () => {
    setLoadingScenarios(true);
    try {
      const data = await getAllSimulationScenarios();
      setScenarios(data);
    } catch (err) {
      console.error("Failed to load scenarios", err);
    } finally {
      setLoadingScenarios(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDownloadTemplate = () => {
    // These columns form the documented workbook contract for custom scenarios.
    const shelterHeaders = ["id", "name", "latti", "longi", "negeri", "daerah", "mukim", "bencana", "disasterType", "status", "operationalStatus", "mangsa", "keluarga", "kapasiti", "lastUpdatedAt"];
    const weatherAlertHeaders = ["id", "source", "title", "titleBm", "description", "descriptionBm", "severity", "affectedArea", "issuedAt", "validFrom", "validTo"];
    const forecastHeaders = ["code", "station", "timestamp", "temp", "state", "rainfall", "icon"];
    const timelineEventHeaders = ["id", "eventType", "occurredAt", "endedAt", "shelterId", "weatherAlertId", "disasterType", "state", "district", "title", "description", "source", "metadata"];

    // Default scenario rows provide valid, editable examples for every sheet.
    const sheltersData = rowsFromRecords(defaultScenario.shelters, shelterHeaders);
    const alertsData = rowsFromRecords(defaultScenario.weatherAlerts, weatherAlertHeaders);
    const forecastsData = rowsFromRecords(defaultScenario.weatherForecasts, forecastHeaders, true);
    const timelineEventsData = rowsFromRecords(
      defaultScenario.timelineEvents ?? [],
      timelineEventHeaders,
      true
    );

    const wb = XLSX.utils.book_new();

    const wsShelters = XLSX.utils.aoa_to_sheet([shelterHeaders, ...sheltersData]);
    const wsAlerts = XLSX.utils.aoa_to_sheet([weatherAlertHeaders, ...alertsData]);
    const wsForecasts = XLSX.utils.aoa_to_sheet([forecastHeaders, ...forecastsData]);
    const wsTimelineEvents = XLSX.utils.aoa_to_sheet([timelineEventHeaders, ...timelineEventsData]);

    XLSX.utils.book_append_sheet(wb, wsShelters, "Shelters");
    XLSX.utils.book_append_sheet(wb, wsAlerts, "WeatherAlerts");
    XLSX.utils.book_append_sheet(wb, wsForecasts, "Forecasts");
    XLSX.utils.book_append_sheet(wb, wsTimelineEvents, "TimelineEvents");

    XLSX.writeFile(wb, "emergency_os_scenario_template.xlsx");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file to upload.");
      return;
    }
    if (!scenarioName.trim()) {
      setError("Please provide a name for the scenario.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const sheltersSheet = wb.Sheets["Shelters"];
      const alertsSheet = wb.Sheets["WeatherAlerts"];
      const forecastsSheet = wb.Sheets["Forecasts"];
      const timelineEventsSheet = wb.Sheets["TimelineEvents"];

      if (!sheltersSheet) {
        throw new Error("Invalid Excel structure: Missing 'Shelters' sheet.");
      }

      const shelters = parseShelters(XLSX.utils.sheet_to_json<SpreadsheetRow>(sheltersSheet));
      const weatherAlerts = alertsSheet
        ? parseWeatherAlerts(XLSX.utils.sheet_to_json<SpreadsheetRow>(alertsSheet))
        : [];
      const weatherForecasts = forecastsSheet
        ? parseWeatherForecasts(XLSX.utils.sheet_to_json<SpreadsheetRow>(forecastsSheet))
        : [];
      // Older workbooks remain valid because TimelineEvents is intentionally optional.
      const timelineEvents = timelineEventsSheet
        ? parseTimelineEvents(XLSX.utils.sheet_to_json<SpreadsheetRow>(timelineEventsSheet))
        : [];

      // Construct Scenario
      const jsonData: EmergencyScenario = {
        id: "sim-" + Date.now(),
        name: scenarioName,
        description: "Uploaded via Simulation Dashboard",
        shelters,
        weatherAlerts,
        weatherForecasts,
        timelineEvents,
        // The rest can be empty or defaulted
        savedLocations: [],
        alertPreferences: [],
        notifications: [],
        sosRequests: [],
        emergencyContacts: [],
        governmentNotices: [],
        reports: [],
        dataSources: []
      };

      const plainJsonData = JSON.parse(JSON.stringify(jsonData)) as EmergencyScenario;
      await uploadSimulationScenario(scenarioName, plainJsonData);
      setSuccess(`Scenario "${scenarioName}" uploaded and activated with ${timelineEvents.length} timeline events. Notifications regenerated.`);
      setFile(null);
      setScenarioName("");
      await fetchScenarios();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to process the Excel file. Ensure it matches the template format."));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchScenario = async (id: string, name: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await activateSimulationScenario(id);
      setSuccess(`Switched to "${name}". Notifications regenerated based on current locations.`);
      await fetchScenarios();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to switch scenario."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl pt-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 tracking-tight text-foreground">Simulation Data Dashboard</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-200 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* UPLOAD SECTION */}
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Upload New Scenario</h2>
          <p className="text-foreground/70 mb-6 text-sm">
            Upload an Excel (.xlsx) file with custom shelters, alerts, forecasts, and timeline events. This becomes your isolated test environment.
          </p>

          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-background hover:bg-muted text-foreground rounded-lg transition-colors border border-border text-xs font-semibold"
            >
              ↓ Download Excel Template
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Scenario Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Heavy Flood Q4 2026"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Excel File (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Processing..." : "Upload & Activate"}
            </button>
          </div>
        </div>

        {/* SWITCHER SECTION */}
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Available Scenarios</h2>
          <p className="text-foreground/70 mb-4 text-sm">
            Switching scenarios will wipe old simulation notifications and regenerate new ones for your currently saved locations.
          </p>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[400px]">
            {loadingScenarios ? (
              <div className="text-center py-10 text-foreground/50 text-sm">Loading scenarios...</div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl text-foreground/50 text-sm">
                No scenarios uploaded yet.
              </div>
            ) : (
              scenarios.map((scenario) => (
                <div 
                  key={scenario.id} 
                  className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${scenario.is_active ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-background border-border'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${scenario.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                        {scenario.name}
                      </h3>
                      <p className="text-xs text-foreground/40 mt-1">
                        Uploaded: {new Date(scenario.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {scenario.is_active && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                        Active
                      </span>
                    )}
                  </div>

                  {!scenario.is_active && (
                    <button
                      onClick={() => handleSwitchScenario(scenario.id, scenario.name)}
                      disabled={loading}
                      className="w-full py-2 text-sm font-semibold rounded-lg bg-background hover:bg-muted text-foreground border border-border transition-colors disabled:opacity-50"
                    >
                      Switch to this Scenario
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
