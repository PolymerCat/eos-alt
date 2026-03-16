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
          <section className="bg-panel border border-border p-6 rounded-sm">
            <h2 className="text-lg font-mono font-bold uppercase text-accent border-b border-border pb-2 mb-4">
              Identity Matrix
            </h2>
            <ActionForm
              actionFunc={updateProfile}
              successMessage="Identity Updated Successfully"
              errorMessage="Identity Update Failed"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-sm font-mono uppercase text-foreground/70" htmlFor="full_name">
                  Designation (Full Name)
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name || ""}
                  required
                  placeholder="E.g. John Doe"
                  className="rounded-sm px-4 py-2 bg-background border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <button type="submit" className="bg-foreground text-background font-bold font-mono py-2 px-4 uppercase text-sm hover:brightness-110 transition-all border border-foreground mt-2">
                Update Identity
              </button>
            </ActionForm>
          </section>

          {/* Saved Locations List */}
          <section className="bg-panel border border-border p-6 rounded-sm flex-grow">
            <h2 className="text-lg font-mono font-bold uppercase text-foreground/90 border-b border-border pb-2 mb-4 flex justify-between items-center">
              Registered Beacons
              <span className="text-xs text-foreground/50 bg-background px-2 py-0.5 rounded border border-border">Count: {locations.length}</span>
            </h2>

            {locations.length === 0 ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-border/50 bg-background/50">
                <p className="font-mono text-sm text-foreground/40 uppercase">No active beacons.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {locations.map((loc: any) => (
                  <li key={loc.id} className="p-3 bg-background border border-border/50 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-sm text-foreground uppercase">{loc.districts?.district}</p>
                        <p className="font-mono text-xs text-foreground/60 uppercase">{loc.states?.state_name}</p>
                      </div>
                      <DeleteButton actionFunc={async () => {
                        "use server";
                        await deleteLocation(loc.id);
                      }} />
                    </div>
                    <div className="pt-2 border-t border-border/30 flex justify-between text-[10px] font-mono text-foreground/40">
                      <span>LAT: {loc.latitude.toFixed(4)}</span>
                      <span>LNG: {loc.longitude.toFixed(4)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div >

        {/* RIGHT COLUMN: LOCATION PICKER */}
        < div className="lg:col-span-2" >
          <section className="bg-panel border border-border p-6 rounded-sm h-full flex flex-col">
            <h2 className="text-lg font-mono font-bold uppercase text-accent border-b border-border pb-2 mb-6">
              Deploy New Beacon
            </h2>
            {/* Passed down directly to the client component */}
            <div className="flex-grow flex">
              {/* Pass finalDistricts directly as an array */}
              <LocationPicker states={states} districts={finalDistricts} />
            </div>
          </section>
        </div >

      </div >

    </div >
  );
}
