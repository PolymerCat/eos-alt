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
  const { data, error } = await supabase
    .from("districts")
    .select("*")
    .eq("state", stateCode)
    .order("district");

  if (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
  return data;
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
      states:state(state_name),
      districts:district(district)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
  return data;
}

export async function saveLocation(state: number, district: number, lat: number, lng: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_locations")
    .insert({
      user_id: user.id,
      state,
      district,
      latitude: lat,
      longitude: lng
    });

  if (error) {
    console.error("Error saving location:", error);
    throw new Error("Failed to save location");
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
