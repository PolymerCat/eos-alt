"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- PROFILES ---

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no row found, which is fine for new users
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const full_name = formData.get("full_name") as string;

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id, // Using upsert so it creates if not exists
      full_name,
    });

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(`Failed to update profile: ${error.message} (Code: ${error.code})`);
  }

  revalidatePath("/profile");
}

// --- LOCATIONS ---

export async function getStates() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("states").select("*").order("code");
  if (error) {
    console.error("Error fetching states:", error);
    return [];
  }
  return data;
}

export async function getDistricts(stateCode: number) {
  const supabase = await createClient();

  const { data: stateData } = await supabase
    .from("states")
    .select("state_name")
    .eq("code", stateCode)
    .single();

  const stateName = stateData?.state_name ?? "";

  const { data, error } = await supabase
    .from("districts")
    .select("*")
    .eq("state", stateCode)
    .order("district");

  if (error) {
    console.error("Error fetching districts:", error);
    return [];
  }

  if (data && stateName) {
    return data.map((d) => ({
      ...d,
      district: normalizeDistrictName(d.district, stateName, stateCode),
    }));
  }
  return data;
}

function normalizeDistrictName(district: string, stateName: string, stateCode: number): string {
  if (!district) return "";
  if (!stateName) return district;

  const regex = new RegExp(`\\b${stateCode}\\b`, "g");
  return district.replace(regex, stateName).trim();
}

export async function getUserLocations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_locations")
    .select(`
      id,
      latitude,
      longitude,
      state,
      district,
      states:state(state_name),
      districts:district(district)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  // Normalize corrupted district names containing state codes (e.g. Kuala 11 -> Kuala Terengganu)
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

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function checkEmergenciesAndAlertsForLocation(
  userId: string,
  stateId: number,
  districtId: number,
  lat: number,
  lng: number
) {
  const supabase = await createClient();

  // 1. Fetch State Name
  const { data: stateData } = await supabase
    .from("states")
    .select("state_name")
    .eq("code", stateId)
    .single();

  // 2. Fetch District Name
  const { data: districtData } = await supabase
    .from("districts")
    .select("district")
    .eq("id", districtId)
    .single();

  const stateName = stateData?.state_name ?? "";
  let districtName = districtData?.district ?? "";

  if (districtName && stateName) {
    districtName = normalizeDistrictName(districtName, stateName, stateId);
  }

  // 3. Fetch active JKM shelter snapshots
  const { data: activeSnapshots, error: snapshotError } = await supabase
    .from("shelter_snapshots")
    .select(`
      shelter_id,
      capacity,
      victims,
      families,
      shelters (
        id, name, latitude, longitude,
        state, district, mukim, disaster_type
      )
    `)
    .eq("status", "active");

  if (snapshotError) {
    console.error("Error fetching active snapshots for check:", snapshotError);
  }

  // Deduplicate shelters in-memory
  const seenShelterIds = new Set<string>();
  const activeShelters = [];
  if (activeSnapshots) {
    for (const row of activeSnapshots as any[]) {
      if (seenShelterIds.has(row.shelter_id)) continue;
      seenShelterIds.add(row.shelter_id);

      const s = Array.isArray(row.shelters) ? row.shelters[0] : row.shelters;
      if (s) {
        activeShelters.push({
          id: s.id,
          name: s.name,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          state: s.state,
          district: s.district,
          mukim: s.mukim,
          disaster_type: s.disaster_type,
          victims: row.victims ?? "0",
          families: row.families ?? "0",
          capacity: row.capacity ?? "0.00%",
        });
      }
    }
  }

  // Look for matching/nearby shelters
  const matchingShelters = [];
  for (const shelter of activeShelters) {
    const distance = getDistanceKm(lat, lng, shelter.latitude, shelter.longitude);
    const sameDistrict =
      districtName &&
      shelter.district &&
      districtName.trim().toLowerCase() === shelter.district.trim().toLowerCase();
    const sameState =
      stateName &&
      shelter.state &&
      stateName.trim().toLowerCase() === shelter.state.trim().toLowerCase();

    if (distance <= 15 || (sameDistrict && sameState)) {
      matchingShelters.push({
        ...shelter,
        distance,
        matchReason:
          distance <= 15
            ? `within ${distance.toFixed(1)} km of your saved coordinates`
            : `located in the same district (${districtName})`,
      });
    }
  }

  // 4. Fetch active weather alerts
  const { data: activeAlerts, error: alertError } = await supabase
    .from("weather_alerts")
    .select("id, source, title, description, severity, affected_area, state, valid_from, valid_to")
    .or("valid_to.is.null,valid_to.gte." + new Date().toISOString());

  if (alertError) {
    console.error("Error fetching active weather alerts for check:", alertError);
  }

  const matchingAlerts = [];
  if (activeAlerts) {
    for (const alert of activeAlerts) {
      const sameState =
        stateName &&
        alert.state &&
        (alert.state.trim().toLowerCase().includes(stateName.trim().toLowerCase()) ||
          stateName.trim().toLowerCase().includes(alert.state.trim().toLowerCase()));

      const districtMentioned =
        districtName &&
        ((alert.affected_area &&
          alert.affected_area.trim().toLowerCase().includes(districtName.trim().toLowerCase())) ||
          (alert.description &&
            alert.description.trim().toLowerCase().includes(districtName.trim().toLowerCase())));

      if (sameState || districtMentioned) {
        matchingAlerts.push({
          ...alert,
          matchReason: districtMentioned
            ? `mentions your district (${districtName})`
            : `issued for your state (${stateName})`,
        });
      }
    }
  }

  // 5. Build notifications to insert
  const notificationsToInsert = [];

  for (const shelter of matchingShelters) {
    notificationsToInsert.push({
      user_id: userId,
      title: `🚨 Emergency Shelter Opened Nearby`,
      message: `The temporary shelter (PPS) "${shelter.name}" is active ${shelter.matchReason}. Current occupancy: ${shelter.victims} victims (${shelter.families} families).`,
      delivery_method: "in_app",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  for (const alert of matchingAlerts) {
    notificationsToInsert.push({
      user_id: userId,
      weather_alert_id: alert.id,
      title: `⚠️ Weather Alert in Your Area`,
      message: `A weather alert (${alert.severity}) has been detected ${alert.matchReason}: "${alert.title}". Details: ${alert.description || "No further details available."}`,
      delivery_method: "in_app",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  // 6. Write to notifications table
  if (notificationsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notificationsToInsert);

    if (insertError) {
      console.error("Error creating notifications for saved location:", insertError);
    }
  }
}

export async function saveLocation(state: number, district: number, lat: number, lng: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("user_locations").insert({
    user_id: user.id,
    state,
    district,
    latitude: lat,
    longitude: lng,
  });

  if (error) {
    console.error("Error saving location:", error);
    throw new Error("Failed to save location");
  }

  // Trigger immediate check for matching emergencies & alerts
  try {
    await checkEmergenciesAndAlertsForLocation(user.id, state, district, lat, lng);
  } catch (checkErr) {
    console.error("Error checking emergencies during saveLocation:", checkErr);
    // Do not throw or block the main location save if notification generation fails
  }

  revalidatePath("/profile");
}

export async function deleteLocation(locationId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_locations")
    .delete()
    .eq("id", locationId)
    .eq("user_id", user.id); // Ensure user owns the record

  if (error) {
    console.error("Error deleting location:", error);
    throw new Error("Failed to delete location");
  }

  revalidatePath("/profile");
}
