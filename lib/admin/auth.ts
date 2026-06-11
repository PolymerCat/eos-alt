import { createClient } from "@/utils/supabase/server";

export interface AdminAccess {
  isAdmin: boolean;
  user: {
    id: string;
    email?: string;
  } | null;
  reason: string;
}

function getAdminEmailAllowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Checks whether the current authenticated user can access admin pages.
 * ADMIN_EMAILS is kept as a development fallback while the profiles.role
 * migration is being adopted across Supabase environments.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, reason: "No authenticated user." };
  }

  const email = user.email?.toLowerCase();
  const adminEmails = getAdminEmailAllowlist();

  if (email && adminEmails.has(email)) {
    return {
      isAdmin: true,
      user: { id: user.id, email: user.email },
      reason: "Granted by ADMIN_EMAILS allowlist.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && data && typeof data.role === "string" && data.role === "admin") {
    return {
      isAdmin: true,
      user: { id: user.id, email: user.email },
      reason: "Granted by profiles.role.",
    };
  }

  // Compatibility for environments created before profiles.role existed.
  // Migration 012 copies these assignments into role, after which this branch
  // can be removed in a future cleanup.
  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!legacyError && legacyData?.is_admin === true) {
    return {
      isAdmin: true,
      user: { id: user.id, email: user.email },
      reason: "Granted by legacy profiles.is_admin. Apply migration 012.",
    };
  }

  return {
    isAdmin: false,
    user: { id: user.id, email: user.email },
    reason: error && legacyError
      ? "Admin role could not be read. Configure ADMIN_EMAILS or apply the admin role migration."
      : "User is not marked as admin.",
  };
}
