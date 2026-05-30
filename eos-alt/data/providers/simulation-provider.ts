import { defaultScenario, simulationScenarios } from "@/data/mock/emergency-scenarios";
import type { EmergencyDataSnapshot, EmergencyScenario } from "@/types/emergency";
import { getActiveSimulationScenario, getSimulationUserLocations, getSimulationNotifications } from "@/app/profile/sim-actions";


export async function getSimulationEmergencyData(
  scenarioId?: string
): Promise<EmergencyDataSnapshot> {
  let scenario: EmergencyScenario = defaultScenario;

  try {
    const activeDbScenario = await getActiveSimulationScenario();
    if (activeDbScenario && activeDbScenario.data) {
      scenario = activeDbScenario.data as EmergencyScenario;
    } else if (scenarioId) {
      scenario = simulationScenarios.find((item) => item.id === scenarioId) ?? defaultScenario;
    }
  } catch (error) {
    console.error("Failed to load active simulation scenario from DB, falling back to mock", error);
  }

  let dbLocations = [];
  let dbNotifications = [];
  try {
    const locs = await getSimulationUserLocations();
    // Map db format to expected SavedLocation format
    dbLocations = locs.map((loc: any) => ({
      id: loc.id,
      userId: loc.user_id,
      stateCode: loc.state,
      stateName: loc.states?.state_name,
      districtId: loc.district,
      districtName: loc.districts?.district,
      label: "Saved Location",
      latitude: loc.latitude,
      longitude: loc.longitude,
      createdAt: loc.created_at,
    }));
    
    const notifs = await getSimulationNotifications();
    dbNotifications = notifs.map((n: any) => ({
      id: n.id.toString(),
      userId: n.user_id,
      title: n.title,
      message: n.message,
      deliveryMethod: n.delivery_method === 'in_app' ? 'App Notification' : n.delivery_method,
      status: n.status,
      createdAt: n.created_at,
    }));
  } catch (err) {
    console.error("Failed to load simulation locations or notifications", err);
  }

  return {
    mode: "simulation",
    scenarioName: scenario.name,
    shelters: scenario.shelters || [],
    weatherForecasts: scenario.weatherForecasts || [],
    weatherAlerts: scenario.weatherAlerts || [],
    savedLocations: dbLocations.length > 0 ? dbLocations : (scenario.savedLocations || []),
    alertPreferences: scenario.alertPreferences || [],
    notifications: dbNotifications.length > 0 ? dbNotifications : (scenario.notifications || []),
    sosRequests: scenario.sosRequests || [],
    emergencyContacts: scenario.emergencyContacts || [],
    governmentNotices: scenario.governmentNotices || [],
    reports: scenario.reports || [],
    dataSources: scenario.dataSources || [],
  };
}
