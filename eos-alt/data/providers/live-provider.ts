import { getAlerts, getWeatherWarnings } from "@/app/actions";
import { getUserLocations } from "@/app/profile/actions";
import type { EmergencyDataSnapshot, SavedLocation } from "@/types/emergency";

type JoinedUserLocation = {
  id: number;
  latitude: number;
  longitude: number;
  states?: { state_name?: string } | Array<{ state_name?: string }> | null;
  districts?: { district?: string } | Array<{ district?: string }> | null;
};

function firstRelationValue<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function mapUserLocations(rows: JoinedUserLocation[]): SavedLocation[] {
  return rows.map((row) => {
    const state = firstRelationValue(row.states);
    const district = firstRelationValue(row.districts);

    return {
      id: row.id,
      userId: "current-user",
      stateCode: 0,
      stateName: state?.state_name ?? "Unknown state",
      districtId: 0,
      districtName: district?.district ?? "Unknown district",
      label: district?.district ?? "Saved location",
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: new Date().toISOString(),
    };
  });
}

export async function getLiveEmergencyData(): Promise<EmergencyDataSnapshot> {
  const [shelters, weatherWarnings, userLocations] = await Promise.all([
    getAlerts(),
    getWeatherWarnings(),
    getUserLocations() as Promise<JoinedUserLocation[]>,
  ]);

  return {
    mode: "live",
    shelters,
    weatherWarnings,
    // These arrays are intentionally empty until the related Supabase tables exist.
    weatherAlerts: [],
    savedLocations: mapUserLocations(userLocations),
    alertPreferences: [],
    notifications: [],
    sosRequests: [],
    emergencyContacts: [],
    governmentNotices: [],
    reports: [],
    dataSources: [
      {
        id: "live-jkm",
        name: "JKM Open Shelter API",
        type: "external_api",
        status: shelters.length > 0 ? "online" : "degraded",
        lastCheckedAt: new Date().toISOString(),
        notes:
          shelters.length > 0
            ? "Live shelter data returned successfully."
            : "No active shelter records returned. This can be normal outside emergencies.",
      },
      {
        id: "live-metmalaysia",
        name: "METMalaysia Weather Warning API",
        type: "external_api",
        status: weatherWarnings.length > 0 ? "online" : "degraded",
        lastCheckedAt: new Date().toISOString(),
        notes:
          weatherWarnings.length > 0
            ? "Live weather warning data returned successfully."
            : "No active weather warnings returned.",
      },
    ],
  };
}
