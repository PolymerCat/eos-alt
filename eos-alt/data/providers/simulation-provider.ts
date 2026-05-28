import { defaultScenario, simulationScenarios } from "@/data/mock/emergency-scenarios";
import type { EmergencyDataSnapshot } from "@/types/emergency";

export async function getSimulationEmergencyData(
  scenarioId?: string
): Promise<EmergencyDataSnapshot> {
  const scenario =
    simulationScenarios.find((item) => item.id === scenarioId) ?? defaultScenario;

  return {
    mode: "simulation",
    scenarioName: scenario.name,
    shelters: scenario.shelters,
    weatherWarnings: scenario.weatherWarnings,
    weatherAlerts: scenario.weatherAlerts,
    savedLocations: scenario.savedLocations,
    alertPreferences: scenario.alertPreferences,
    notifications: scenario.notifications,
    sosRequests: scenario.sosRequests,
    emergencyContacts: scenario.emergencyContacts,
    governmentNotices: scenario.governmentNotices,
    reports: scenario.reports,
    dataSources: scenario.dataSources,
  };
}
