import { defaultScenario, simulationScenarios } from "@/data/mock/emergency-scenarios";
import type {
  DeliveryMethod,
  DeliveryStatus,
  EmergencyDataSnapshot,
  EmergencyScenario,
  NotificationRecord,
  SavedLocation,
} from "@/types/emergency";
import { getActiveSimulationScenario, getSimulationUserLocations, getSimulationNotifications } from "@/app/profile/sim-actions";
import type { PPS } from "@/app/actions";

type SimulationLocationRow = {
  id: number;
  user_id: string;
  state: number;
  district: number;
  latitude: number;
  longitude: number;
  label?: string | null;
  description?: string | null;
  created_at?: string | null;
  states?: { state_name?: string | null } | { state_name?: string | null }[] | null;
  districts?: { district?: string | null } | { district?: string | null }[] | null;
};

type SimulationNotificationRow = {
  id: number | string;
  user_id: string;
  title: string;
  message: string;
  delivery_method: string;
  status: string;
  created_at: string;
};

function firstRelationValue<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function toDeliveryMethod(value: string): DeliveryMethod {
  if (value === "sms" || value === "SMS") return "SMS";
  if (value === "email" || value === "Email") return "Email";
  return "App Notification";
}

function toDeliveryStatus(value: string): DeliveryStatus {
  if (value === "failed" || value === "skipped" || value === "pending") return value;
  return "sent";
}

function normalizeSimulationShelter(shelter: PPS): PPS {
  const isInactive = shelter.status === "offline" || shelter.operationalStatus === "inactive";
  return {
    ...shelter,
    disasterType: isInactive ? null : shelter.disasterType ?? shelter.bencana ?? null,
    operationalStatus: isInactive ? "inactive" : "active",
    status: isInactive ? "offline" : shelter.status || "online",
  };
}

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

  let dbLocations: SavedLocation[] = [];
  let dbNotifications: NotificationRecord[] = [];
  try {
    const locs = await getSimulationUserLocations() as SimulationLocationRow[];
    // Map db format to expected SavedLocation format
    dbLocations = locs.map((loc) => {
      const state = firstRelationValue(loc.states);
      const district = firstRelationValue(loc.districts);

      return {
        id: loc.id,
        userId: loc.user_id,
        stateCode: loc.state,
        stateName: state?.state_name ?? "Unknown state",
        districtId: loc.district,
        districtName: district?.district ?? "Unknown district",
        label: loc.label ?? district?.district ?? "Saved Location",
        description: loc.description ?? undefined,
        latitude: loc.latitude,
        longitude: loc.longitude,
        createdAt: loc.created_at ?? new Date().toISOString(),
      };
    });
    
    const notifs = await getSimulationNotifications() as SimulationNotificationRow[];
    dbNotifications = notifs.map((n) => ({
      id: n.id.toString(),
      userId: n.user_id,
      title: n.title,
      message: n.message,
      deliveryMethod: toDeliveryMethod(n.delivery_method),
      status: toDeliveryStatus(n.status),
      createdAt: n.created_at,
    }));
  } catch (err) {
    console.error("Failed to load simulation locations or notifications", err);
  }

  return {
    mode: "simulation",
    scenarioName: scenario.name,
    shelters: (scenario.shelters || []).map(normalizeSimulationShelter),
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
