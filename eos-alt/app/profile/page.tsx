import { getProfile, getStates, getDistricts, getUserLocations, updateProfile, deleteLocation, getNotifications } from "./actions";
import { getSimulationUserLocations, deleteSimulationLocation, getSimulationNotifications } from "./sim-actions";
import LocationPicker from "@/components/LocationPicker";
import { ActionForm, DeleteButton } from "@/components/ActionWrappers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";


export default async function ProfilePage(props: { searchParams: Promise<{ tab?: string }> }) {

  // 1. Get current session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const isSim = searchParams.tab === "simulation";

  // 2. Fetch Data
  const [profile, states, locations, notifications] = await Promise.all([
    getProfile(),
    getStates(),
    isSim ? getSimulationUserLocations() : getUserLocations(),
    isSim ? getSimulationNotifications() : getNotifications()
  ]);

  // 2. Now that 'states' is defined, fetch the dependent data
  const selectedStateId = states[0]?.code;

  const districtsResult = selectedStateId
    ? await getDistricts(selectedStateId)
    : ([] as any);

  const finalDistricts = Array.isArray(districtsResult)
    ? districtsResult
    : (districtsResult as any)?.data || [];

  // 3. Render UI
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: PROFILE, LOCATIONS, NOTIFICATIONS */}
        <div className="lg:col-span-1 flex flex-col gap-8">

          {/* Profile Card */}
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-4">
              User Profile
            </h2>
            <ActionForm
              actionFunc={updateProfile}
              successMessage="Profile updated"
              errorMessage="Update failed"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground/80" htmlFor="full_name">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name || ""}
                  required
                  placeholder="E.g. John Doe"
                  className="rounded-md px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <button type="submit" className="bg-foreground text-background font-medium rounded-md py-2 px-4 text-sm hover:brightness-110 transition-all border border-foreground mt-2">
                Save Changes
              </button>
            </ActionForm>
          </section>

          {/* Saved Locations List */}
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm flex-grow flex flex-col">
            <div className="flex flex-col gap-4 border-b border-border pb-4 mb-4">
              <h2 className="text-lg font-bold text-foreground/90 flex justify-between items-center">
                Saved Locations
                <span className="text-xs text-foreground/50 bg-background px-2 py-0.5 rounded-md border border-border">{locations.length}</span>
              </h2>
              <div className="flex gap-2">
                <Link href="?tab=live" className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-colors ${!isSim ? 'bg-blue-500 text-white' : 'bg-background border border-border text-foreground/60 hover:text-foreground'}`}>
                  Live
                </Link>
                <Link href="?tab=simulation" className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-colors ${isSim ? 'bg-emerald-500 text-white' : 'bg-background border border-border text-foreground/60 hover:text-foreground'}`}>
                  Simulation
                </Link>
              </div>
            </div>

            {locations.length === 0 ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-border/50 bg-background/50 rounded-lg">
                <p className="text-sm text-foreground/50">No saved locations in {isSim ? "simulation" : "live"} mode.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {locations.map((loc: any) => (
                  <li key={loc.id} className="p-3 bg-background border border-border/50 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{loc.districts?.district}</p>
                        <p className="text-xs text-foreground/60">{loc.states?.state_name}</p>
                      </div>
                      <DeleteButton actionFunc={async () => {
                        "use server";
                        if (isSim) {
                          await deleteSimulationLocation(loc.id);
                        } else {
                          await deleteLocation(loc.id);
                        }
                      }} />
                    </div>
                    <div className="pt-2 border-t border-border/30 flex justify-between text-xs text-foreground/40">
                      <span>Lat: {loc.latitude.toFixed(4)}</span>
                      <span>Lng: {loc.longitude.toFixed(4)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notifications */}
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-foreground/90 border-b border-border pb-2 mb-4 flex justify-between items-center">
              Alerts & Notifications
              <span className="text-xs text-foreground/50 bg-background px-2 py-0.5 rounded-md border border-border">{notifications.length}</span>
            </h2>
            
            {notifications.length === 0 ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-border/50 bg-background/50 rounded-lg">
                <p className="text-sm text-foreground/50">No notifications.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {notifications.map((notif: any) => (
                  <li key={notif.id} className="p-3 bg-background border border-border/50 rounded-lg flex flex-col gap-1">
                    <p className="font-semibold text-sm text-foreground">{notif.title}</p>
                    <p className="text-xs text-foreground/80 line-clamp-3">{notif.message}</p>
                    <span className="text-[10px] text-foreground/40 mt-1">{new Date(notif.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div >

        {/* RIGHT COLUMN: LOCATION PICKER */}
        < div className="lg:col-span-2" >
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-6">
              Add New {isSim ? "Simulation " : ""}Location
            </h2>
            <div className="flex-grow flex">
              <LocationPicker states={states} initialDistricts={finalDistricts} isSimulation={isSim} />
            </div>
          </section>
        </div >

      </div >

    </div >
  );
}
