"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeDistrictName, getDistanceKm } from "@/utils/location";
import type { EmergencyScenario } from "@/types/emergency";

const LOCATION_LABEL_MAX_LENGTH = 60;
const LOCATION_DESCRIPTION_MAX_LENGTH = 160;

export interface SaveSimulationLocationInput {
  label: string;
  description?: string;
  state: number;
  district: number;
  latitude: number;
  longitude: number;
}

function normalizeLocationLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeLocationDescription(value?: string): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized.length > 0 ? normalized : null;
}

function validateLocationInput(input: SaveSimulationLocationInput): string | null {
  const label = normalizeLocationLabel(input.label);
  const description = normalizeLocationDescription(input.description);

  if (!label) return "Location name is required.";
  if (label.length > LOCATION_LABEL_MAX_LENGTH) {
    return `Location name must be ${LOCATION_LABEL_MAX_LENGTH} characters or fewer.`;
  }
  if (description && description.length > LOCATION_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${LOCATION_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  if (!Number.isInteger(input.state) || input.state <= 0) return "State is required.";
  if (!Number.isInteger(input.district) || input.district <= 0) return "District is required.";
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    return "A valid latitude is required.";
  }
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    return "A valid longitude is required.";
  }

  return null;
}

// --- SIMULATION SCENARIOS ---

export async function uploadSimulationScenario(name: string, data: EmergencyScenario) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Deactivate existing scenarios
  await supabase
    .from("simulation_scenarios")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // Insert new scenario as active
  const { error } = await supabase
    .from("simulation_scenarios")
    .insert({
      user_id: user.id,
      name,
      data: data as any,
      is_active: true,
    });

  if (error) {
    console.error("Error uploading simulation scenario:", error);
    throw new Error("Failed to upload scenario");
  }

  // Wipe and regenerate notifications for the new scenario
  await wipeAndRegenerateNotifications(user.id);

  revalidatePath("/test-map");
  revalidatePath("/profile");
  revalidatePath("/simulation");
}

export async function getAllSimulationScenarios() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("simulation_scenarios")
    .select("id, name, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scenarios:", error);
    return [];
  }

  return data;
}

export async function activateSimulationScenario(scenarioId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Deactivate existing
  await supabase
    .from("simulation_scenarios")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // Activate new
  const { error } = await supabase
    .from("simulation_scenarios")
    .update({ is_active: true })
    .eq("id", scenarioId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error activating scenario:", error);
    throw new Error("Failed to activate scenario");
  }

  // Wipe and regenerate notifications for the new scenario
  await wipeAndRegenerateNotifications(user.id);

  revalidatePath("/test-map");
  revalidatePath("/profile");
  revalidatePath("/simulation");
}

export async function getActiveSimulationScenario() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("simulation_scenarios")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching active scenario:", error);
    return null;
  }

  return data;
}

// --- SIMULATION LOCATIONS & NOTIFICATIONS ---

export async function getSimulationUserLocations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("simulation_user_locations")
    .select(`
      id,
      latitude,
      longitude,
      state,
      district,
      label,
      description,
      created_at,
      states:state(state_name),
      districts:district(district)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching simulation locations:", error);
    return [];
  }

  const normalized = (data ?? []).map((row: any) => {
    const stateName = Array.isArray(row.states) ? row.states[0]?.state_name : row.states?.state_name;
    const districtObj = Array.isArray(row.districts) ? row.districts[0] : row.districts;

    if (districtObj && districtObj.district && stateName && row.state) {
      districtObj.district = normalizeDistrictName(districtObj.district, stateName, row.state);
    }

    return row;
  });

  return normalized;
}

export async function saveSimulationLocation(input: SaveSimulationLocationInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validationError = validateLocationInput(input);
  if (validationError) throw new Error(validationError);

  const label = normalizeLocationLabel(input.label);
  const description = normalizeLocationDescription(input.description);

  const { error } = await supabase.from("simulation_user_locations").insert({
    user_id: user.id,
    state: input.state,
    district: input.district,
    latitude: input.latitude,
    longitude: input.longitude,
    label,
    description,
  });

  if (error) {
    console.error("Error saving simulation location:", error);
    throw new Error("Failed to save simulation location");
  }

  try {
    await checkSimulationEmergenciesAndAlertsForLocation(
      user.id,
      label,
      input.state,
      input.district,
      input.latitude,
      input.longitude
    );
  } catch (checkErr) {
    console.error("Error checking simulation emergencies:", checkErr);
  }

  revalidatePath("/profile");
}

export async function deleteSimulationLocation(locationId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("simulation_user_locations")
    .delete()
    .eq("id", locationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting simulation location:", error);
    throw new Error("Failed to delete simulation location");
  }

  revalidatePath("/profile");
}

export async function getSimulationNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("simulation_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching simulation notifications:", error);
    return [];
  }
  return data;
}

async function checkSimulationEmergenciesAndAlertsForLocation(
  userId: string,
  locationLabel: string,
  stateId: number,
  districtId: number,
  lat: number,
  lng: number
) {
  const supabase = await createClient();

  // Fetch active simulation scenario
  const { data: activeScenarioData } = await supabase
    .from("simulation_scenarios")
    .select("data")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!activeScenarioData) return; // No active simulation

  const scenario = activeScenarioData.data as EmergencyScenario;

  // 1. Fetch State Name
  const { data: stateData } = await supabase.from("states").select("state_name").eq("code", stateId).single();
  
  // 2. Fetch District Name
  const { data: districtData } = await supabase.from("districts").select("district").eq("id", districtId).single();

  const stateName = stateData?.state_name ?? "";
  let districtName = districtData?.district ?? "";

  if (districtName && stateName) {
    districtName = normalizeDistrictName(districtName, stateName, stateId);
  }

  // 3. Look for matching/nearby shelters in simulation data
  const matchingShelters = [];
  if (scenario.shelters) {
    for (const shelter of scenario.shelters) {
      const sLat = Number(shelter.latti);
      const sLng = Number(shelter.longi);
      
      if (isNaN(sLat) || isNaN(sLng)) continue;

      const distance = getDistanceKm(lat, lng, sLat, sLng);
      const sameDistrict = districtName && shelter.daerah && districtName.trim().toLowerCase() === shelter.daerah.trim().toLowerCase();
      const sameState = stateName && shelter.negeri && stateName.trim().toLowerCase() === shelter.negeri.trim().toLowerCase();

      if (distance <= 15 || (sameDistrict && sameState)) {
        matchingShelters.push({
          ...shelter,
          distance,
          matchReason: distance <= 15 
            ? `within ${distance.toFixed(1)} km of your saved coordinates` 
            : `located in the same district (${districtName})`,
        });
      }
    }
  }

  // 4. Look for matching weather alerts in simulation data
  const matchingAlerts = [];
  if (scenario.weatherAlerts) {
    for (const alert of scenario.weatherAlerts) {
      const sameState = stateName && alert.affectedArea && alert.affectedArea.trim().toLowerCase().includes(stateName.trim().toLowerCase());
      const districtMentioned = districtName && alert.affectedArea && alert.affectedArea.trim().toLowerCase().includes(districtName.trim().toLowerCase());

      // Let's assume affectedArea contains district or state names
      if (sameState || districtMentioned) {
        matchingAlerts.push({
          ...alert,
          matchReason: districtMentioned 
            ? `mentions your district (${districtName})` 
            : `issued near your state`,
        });
      }
    }
  }

  // 5. Build notifications to insert
  const notificationsToInsert = [];

  for (const shelter of matchingShelters) {
    notificationsToInsert.push({
      user_id: userId,
      title: `SIMULATION: Shelter Opened Near ${locationLabel}`,
      message: `The temporary shelter (PPS) "${shelter.name}" is active near ${locationLabel}: ${shelter.matchReason}. Current occupancy: ${shelter.mangsa} victims (${shelter.keluarga} families).`,
      delivery_method: "in_app",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  for (const alert of matchingAlerts) {
    notificationsToInsert.push({
      user_id: userId,
      weather_alert_id: alert.id,
      title: `SIMULATION: Weather Alert Near ${locationLabel}`,
      message: `A weather alert (${alert.severity}) has been detected near ${locationLabel}: ${alert.matchReason}. Alert: "${alert.title}". Details: ${alert.description || "No further details available."}`,
      delivery_method: "in_app",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  // 6. Write to simulation_notifications table
  if (notificationsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("simulation_notifications")
      .insert(notificationsToInsert);

    if (insertError) {
      console.error("Error creating simulation notifications:", insertError);
    }
  }
}

async function wipeAndRegenerateNotifications(userId: string) {
  const supabase = await createClient();
  
  // 1. Delete all existing simulation notifications for the user
  await supabase
    .from("simulation_notifications")
    .delete()
    .eq("user_id", userId);

  // 2. Fetch all existing simulation user locations
  const { data: locations } = await supabase
    .from("simulation_user_locations")
    .select("*")
    .eq("user_id", userId);

  // 3. Re-evaluate each location against the newly activated scenario
  if (locations && locations.length > 0) {
    for (const loc of locations) {
      await checkSimulationEmergenciesAndAlertsForLocation(
        userId,
        loc.label?.trim() || "Saved Location",
        loc.state,
        loc.district,
        loc.latitude,
        loc.longitude
      );
    }
  }
}
