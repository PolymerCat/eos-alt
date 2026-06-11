import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import DeleteUserButton from "@/components/admin/DeleteUserButton";
import { getAdminAccess } from "@/lib/admin/auth";
import { createClient } from "@/utils/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone_number?: string | null;
  role?: string | null;
  created_at: string | null;
};

type ProfilesResult = {
  profiles: ProfileRow[];
  error?: string;
  errorCode?: string;
};

async function getProfiles(): Promise<ProfilesResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { profiles: [], error: error.message, errorCode: error.code };
  }

  return { profiles: (data ?? []) as ProfileRow[] };
}

export default async function AdminUsersPage() {
  const access = await getAdminAccess();
  const { profiles, error, errorCode } = await getProfiles();
  const errorDescription =
    errorCode === "42703"
      ? `Supabase profile schema is outdated: ${error}. Apply migration 012_admin_profile_management.sql.`
      : `Supabase could not read profiles: ${error}. Confirm migration 012 is applied and the signed-in profile has role = 'admin'.`;

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Monitor accounts and permanently remove regular users when required. Admin accounts are protected from deletion."
      />

      {error ? (
        <AdminEmptyState
          title="User records are not readable yet"
          description={errorDescription}
        />
      ) : profiles.length === 0 ? (
        <AdminEmptyState title="No profiles found" description="Profiles will appear here after users create or update their account details." />
      ) : (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <article key={profile.id} className="min-w-0 rounded-lg border border-border bg-panel p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground [overflow-wrap:anywhere]">{profile.full_name || "Unnamed user"}</h3>
                  <p className="mt-1 truncate text-xs text-foreground/45">{profile.id}</p>
                  <p className="mt-2 text-sm text-foreground/60">{profile.phone_number || "No phone number saved"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <AdminStatusPill label={profile.role ?? "user"} tone={profile.role === "admin" ? "green" : "gray"} />
                  {profile.role !== "admin" && profile.id !== access.user?.id ? (
                    <DeleteUserButton
                      userId={profile.id}
                      userLabel={profile.full_name || "Unnamed user"}
                    />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
