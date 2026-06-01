"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { DeliveryMethod, EmergencyContact, SosRequest } from "@/types/emergency";

export interface SubmitSosRequestInput {
  latitude: number;
  longitude: number;
  message: string;
  contactId?: string;
}

export interface SubmitSosRequestResult {
  ok: boolean;
  request?: SosRequest;
  error?: string;
}

export interface EmergencyContactInput {
  name: string;
  role: string;
  phoneNumber: string;
  deliveryMethod: DeliveryMethod;
  isPrimary: boolean;
}

export interface EmergencyContactResult {
  ok: boolean;
  contact?: EmergencyContact;
  deletedId?: string;
  error?: string;
}

type SosRequestRow = {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  message: string;
  status: SosRequest["status"];
  contact_id?: string | null;
  created_at: string;
};

type EmergencyContactRow = {
  id: string;
  name: string;
  role: string | null;
  phone_number: string;
  delivery_method: string | null;
  is_primary: boolean;
};

function mapDeliveryMethod(value: string | null): DeliveryMethod {
  if (value === "Email" || value === "email") return "Email";
  if (value === "SMS" || value === "sms") return "SMS";
  return "App Notification";
}

function mapEmergencyContact(row: EmergencyContactRow): EmergencyContact {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    phoneNumber: row.phone_number,
    deliveryMethod: mapDeliveryMethod(row.delivery_method),
    isPrimary: row.is_primary,
  };
}

function mapSosRequest(row: SosRequestRow): SosRequest {
  return {
    id: row.id,
    userId: row.user_id,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    message: row.message,
    status: row.status,
    contactId: row.contact_id ?? undefined,
    createdAt: row.created_at,
  };
}

function validateCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isMissingContactIdColumnError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST204" ||
    error.message?.toLowerCase().includes("contact_id") === true
  );
}

function normalizeContactInput(input: EmergencyContactInput): EmergencyContactInput {
  return {
    name: input.name.trim(),
    role: input.role.trim(),
    phoneNumber: input.phoneNumber.trim(),
    deliveryMethod: input.deliveryMethod,
    isPrimary: input.isPrimary,
  };
}

function validateContactInput(input: EmergencyContactInput): string | null {
  if (!input.name) return "Contact name is required.";
  if (!input.phoneNumber) return "Contact phone number is required.";
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(input.phoneNumber)) {
    return "Use a valid phone number with country code when possible.";
  }
  return null;
}

/**
 * Persists a live SOS request after the client has collected location and message details.
 * External delivery is intentionally kept out of this action for now; the UI opens WhatsApp
 * through a deep link after this database record is created successfully.
 */
export async function submitSosRequest(
  input: SubmitSosRequestInput
): Promise<SubmitSosRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to send an SOS request." };
  }

  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: "SOS message cannot be empty." };
  }

  if (
    !validateCoordinate(input.latitude, -90, 90) ||
    !validateCoordinate(input.longitude, -180, 180)
  ) {
    return { ok: false, error: "A valid current location is required before sending SOS." };
  }

  const insertPayload = {
    user_id: user.id,
    latitude: input.latitude,
    longitude: input.longitude,
    message,
    status: "submitted",
  };

  const primaryResult = await supabase
    .from("sos_requests")
    .insert({
      ...insertPayload,
      contact_id: input.contactId || null,
    })
    .select("id, user_id, latitude, longitude, message, status, contact_id, created_at")
    .single();

  let data = primaryResult.data as SosRequestRow | null;
  let error = primaryResult.error;

  if (error && isMissingContactIdColumnError(error)) {
    // Older local/Supabase schemas do not have contact_id yet. Save the SOS first,
    // then add the migration so future records can keep the selected-contact link.
    const fallbackResult = await supabase
      .from("sos_requests")
      .insert(insertPayload)
      .select("id, user_id, latitude, longitude, message, status, created_at")
      .single();

    data = fallbackResult.data as SosRequestRow | null;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("Failed to submit SOS request:", error);
    return { ok: false, error: "Failed to save SOS request. Please try again." };
  }

  revalidatePath("/test-ui/sos");

  return {
    ok: true,
    request: mapSosRequest(data as SosRequestRow),
  };
}

/**
 * Creates a user-owned emergency contact. When a contact is marked primary,
 * existing contacts are demoted first so contact selection stays deterministic.
 */
export async function createEmergencyContact(
  input: EmergencyContactInput
): Promise<EmergencyContactResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) return { ok: false, error: "You must be signed in to manage contacts." };

  const normalized = normalizeContactInput(input);
  const validationError = validateContactInput(normalized);
  if (validationError) return { ok: false, error: validationError };

  if (normalized.isPrimary) {
    const { error } = await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to demote existing emergency contacts:", error);
      return { ok: false, error: "Failed to update primary contact state." };
    }
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: userId,
      name: normalized.name,
      role: normalized.role || null,
      phone_number: normalized.phoneNumber,
      delivery_method: normalized.deliveryMethod,
      is_primary: normalized.isPrimary,
    })
    .select("id, name, role, phone_number, delivery_method, is_primary")
    .single();

  if (error) {
    console.error("Failed to create emergency contact:", error);
    return { ok: false, error: "Failed to save emergency contact." };
  }

  revalidatePath("/test-ui/sos");
  return { ok: true, contact: mapEmergencyContact(data as EmergencyContactRow) };
}

export async function updateEmergencyContact(
  contactId: string,
  input: EmergencyContactInput
): Promise<EmergencyContactResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) return { ok: false, error: "You must be signed in to manage contacts." };

  const normalized = normalizeContactInput(input);
  const validationError = validateContactInput(normalized);
  if (validationError) return { ok: false, error: validationError };

  if (normalized.isPrimary) {
    const { error } = await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to demote existing emergency contacts:", error);
      return { ok: false, error: "Failed to update primary contact state." };
    }
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .update({
      name: normalized.name,
      role: normalized.role || null,
      phone_number: normalized.phoneNumber,
      delivery_method: normalized.deliveryMethod,
      is_primary: normalized.isPrimary,
    })
    .eq("id", contactId)
    .eq("user_id", userId)
    .select("id, name, role, phone_number, delivery_method, is_primary")
    .single();

  if (error) {
    console.error("Failed to update emergency contact:", error);
    return { ok: false, error: "Failed to update emergency contact." };
  }

  revalidatePath("/test-ui/sos");
  return { ok: true, contact: mapEmergencyContact(data as EmergencyContactRow) };
}

export async function deleteEmergencyContact(contactId: string): Promise<EmergencyContactResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) return { ok: false, error: "You must be signed in to manage contacts." };

  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete emergency contact:", error);
    return { ok: false, error: "Failed to delete emergency contact." };
  }

  revalidatePath("/test-ui/sos");
  return { ok: true, deletedId: contactId };
}

export async function setPrimaryEmergencyContact(contactId: string): Promise<EmergencyContactResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) return { ok: false, error: "You must be signed in to manage contacts." };

  const { error: demoteError } = await supabase
    .from("emergency_contacts")
    .update({ is_primary: false })
    .eq("user_id", userId);

  if (demoteError) {
    console.error("Failed to demote existing emergency contacts:", demoteError);
    return { ok: false, error: "Failed to update primary contact state." };
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .update({ is_primary: true })
    .eq("id", contactId)
    .eq("user_id", userId)
    .select("id, name, role, phone_number, delivery_method, is_primary")
    .single();

  if (error) {
    console.error("Failed to set primary emergency contact:", error);
    return { ok: false, error: "Failed to set primary contact." };
  }

  revalidatePath("/test-ui/sos");
  return { ok: true, contact: mapEmergencyContact(data as EmergencyContactRow) };
}
