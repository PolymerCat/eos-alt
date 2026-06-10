import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import { createClient } from "@/utils/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone_number?: string | null;
  role?: string | null;
  created_at: string | null;
};

async function getProfiles(): Promise<{ profiles: ProfileRow[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { profiles: [], error: error.message };
  }

  return { profiles: (data ?? []) as ProfileRow[] };
}

export default async function AdminUsersPage() {
  const { profiles, error } = await getProfiles();

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Read-only first pass for account monitoring. Role editing should be added after admin RLS policies are finalized."
      />

      {error ? (
        <AdminEmptyState
          title="User records are not readable yet"
          description={`Supabase returned: ${error}. Add admin RLS policies before enabling full user management.`}
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
                <AdminStatusPill label={profile.role ?? "user"} tone={profile.role === "admin" ? "green" : "gray"} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
