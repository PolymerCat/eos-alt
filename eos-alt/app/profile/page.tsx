import { getProfile, getStates, getDistricts, getUserLocations, updateProfile, deleteLocation } from "./actions";
import LocationPicker from "@/components/LocationPicker";
import { ActionForm, DeleteButton } from "@/components/ActionWrappers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";


export default async function ProfilePage() {

  // 1. Get current session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }



  // 2. Fetch Data
  const [profile, states, locations] = await Promise.all([
    getProfile(),
    getStates(),
    getUserLocations()
  ]);

  // --- DEBUG LOGS ---
  console.log("--- SUPABASE DATA FETCH CHECK ---");
  console.log("States Count:", states?.length || 0);
  if (states && states.length > 0) {
    console.table(states.slice(0, 5)); // Shows first 5 states in a nice table
  } else {
    console.warn("WARNING: No states returned from Supabase. Check your table permissions (RLS).");
  }
  console.log("---------------------------------");
  // ------------------

  // 2. Now that 'states' is defined, fetch the dependent data
  const selectedStateId = states[0].code;

  // Fetch data. We use 'as any' here to prevent the 'never' inference
  const districtsResult = selectedStateId
    ? await getDistricts(selectedStateId)
    : ([] as any);

  // Extract the array safely
  const finalDistricts = Array.isArray(districtsResult)
    ? districtsResult
    : (districtsResult as any)?.data || [];


  // Log districts result
  console.log(`Districts for State ${selectedStateId}:`, Array.isArray(districtsResult) ? districtsResult.length : "Data is object");

  // 3. Render UI
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: PROFILE & LOCATIONS */}
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
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm flex-grow">
            <h2 className="text-lg font-bold text-foreground/90 border-b border-border pb-2 mb-4 flex justify-between items-center">
              Saved Locations
              <span className="text-xs text-foreground/50 bg-background px-2 py-0.5 rounded-md border border-border">{locations.length} Locations</span>
            </h2>

            {locations.length === 0 ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-border/50 bg-background/50 rounded-lg">
                <p className="text-sm text-foreground/50">No saved locations.</p>
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
                        await deleteLocation(loc.id);
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

        </div >

        {/* RIGHT COLUMN: LOCATION PICKER */}
        < div className="lg:col-span-2" >
          <section className="bg-panel border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-6">
              Add New Location
            </h2>
            {/* Passed down directly to the client component */}
            <div className="flex-grow flex">
              {/* Pass finalDistricts directly as an array */}
              <LocationPicker states={states} initialDistricts={finalDistricts} />
            </div>
          </section>
        </div >

      </div >

    </div >
  );
}
