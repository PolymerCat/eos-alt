"use client";

import { useState, useEffect } from "react";
import { uploadSimulationScenario, getAllSimulationScenarios, activateSimulationScenario } from "@/app/profile/sim-actions";
import { defaultScenario } from "@/data/mock/emergency-scenarios";
import type { EmergencyScenario } from "@/types/emergency";
import * as XLSX from "xlsx";

export default function SimulationDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [scenarios, setScenarios] = useState<any[]>([]);
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
    // Define the columns based on the default scenario data
    const shelterHeaders = ["id", "name", "latti", "longi", "negeri", "daerah", "mukim", "bencana", "mangsa", "keluarga", "kapasiti"];
    const weatherAlertHeaders = ["id", "source", "title", "titleBm", "description", "descriptionBm", "severity", "affectedArea", "issuedAt", "validFrom", "validTo"];
    const forecastHeaders = ["code", "station", "timestamp", "temp", "state", "icon"];

    // Provide some sample data
    const sheltersData = defaultScenario.shelters.map(s => shelterHeaders.map(h => (s as any)[h] || ""));
    const alertsData = defaultScenario.weatherAlerts.map(a => weatherAlertHeaders.map(h => (a as any)[h] || ""));
    const forecastsData = defaultScenario.weatherForecasts.map(f => forecastHeaders.map(h => (f as any)[h] || ""));

    const wb = XLSX.utils.book_new();

    const wsShelters = XLSX.utils.aoa_to_sheet([shelterHeaders, ...sheltersData]);
    const wsAlerts = XLSX.utils.aoa_to_sheet([weatherAlertHeaders, ...alertsData]);
    const wsForecasts = XLSX.utils.aoa_to_sheet([forecastHeaders, ...forecastsData]);

    XLSX.utils.book_append_sheet(wb, wsShelters, "Shelters");
    XLSX.utils.book_append_sheet(wb, wsAlerts, "WeatherAlerts");
    XLSX.utils.book_append_sheet(wb, wsForecasts, "Forecasts");

    XLSX.writeFile(wb, "scenario_template.xlsx");
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

      if (!sheltersSheet) {
        throw new Error("Invalid Excel structure: Missing 'Shelters' sheet.");
      }

      const shelters = XLSX.utils.sheet_to_json(sheltersSheet) as any[];
      const weatherAlerts = alertsSheet ? (XLSX.utils.sheet_to_json(alertsSheet) as any[]) : [];
      const weatherForecasts = forecastsSheet ? (XLSX.utils.sheet_to_json(forecastsSheet) as any[]) : [];

      // Validate coordinates in shelters
      const validShelters = shelters.map(s => ({
        ...s,
        latti: String(s.latti),
        longi: String(s.longi),
        mangsa: String(s.mangsa || "0"),
        keluarga: String(s.keluarga || "0"),
        kapasiti: String(s.kapasiti || "0.00%")
      }));

      // Construct Scenario
      const jsonData: EmergencyScenario = {
        id: "sim-" + Date.now(),
        name: scenarioName,
        description: "Uploaded via Simulation Dashboard",
        shelters: validShelters,
        weatherAlerts,
        weatherForecasts,
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

      const plainJsonData = JSON.parse(JSON.stringify(jsonData));
      await uploadSimulationScenario(scenarioName, plainJsonData);
      setSuccess(`Scenario "${scenarioName}" uploaded and activated successfully! Notifications regenerated.`);
      setFile(null);
      setScenarioName("");
      await fetchScenarios();
    } catch (err: any) {
      setError(err.message || "Failed to process the Excel file. Ensure it matches the template format.");
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
    } catch (err: any) {
      setError(err.message || "Failed to switch scenario.");
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
            Upload an Excel (.xlsx) file with custom emergency data. This becomes your isolated test environment.
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
