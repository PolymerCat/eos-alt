"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAdminAccess } from "@/lib/admin/auth";
import { createClient } from "@/utils/supabase/server";

export interface DeleteUserResult {
  ok: boolean;
  error?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Permanently removes a regular user through Supabase Auth. Deleting the Auth
 * identity allows ON DELETE CASCADE foreign keys to remove user-owned records.
 * The service-role key is read only inside this server action.
 */
export async function deleteUserAsAdmin(userId: string): Promise<DeleteUserResult> {
  const access = await getAdminAccess();

  if (!access.isAdmin || !access.user) {
    return { ok: false, error: "Admin access is required." };
  }
  if (!UUID_PATTERN.test(userId)) {
    return { ok: false, error: "The selected user ID is invalid." };
  }
  if (userId === access.user.id) {
    return { ok: false, error: "You cannot delete your own admin account." };
  }

  // Use the request-scoped client to enforce the admin profile-read policy
  // before escalating to the server-only Auth admin API.
  const requestClient = await createClient();
  const { data: targetProfile, error: profileError } = await requestClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to verify target profile before deletion:", profileError);
    return {
      ok: false,
      error: "Unable to verify the selected user. Confirm migration 012 is applied.",
    };
  }
  if (!targetProfile) {
    return { ok: false, error: "The selected profile no longer exists." };
  }
  if (targetProfile.role === "admin") {
    return { ok: false, error: "Admin accounts cannot be deleted from this page." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server.",
    };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Supabase Auth user deletion failed:", error);
    return { ok: false, error: `Supabase could not delete the user: ${error.message}` };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

