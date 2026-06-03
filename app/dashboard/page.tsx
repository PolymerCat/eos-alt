import Link from "next/link";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";
import type { SavedLocation } from "@/types/emergency";
import { createClient } from "@/utils/supabase/server";
import LiveUpdateBar from "@/components/live-update-bar";
import WeatherForecastWidget, { WeatherForecastLocation } from "@/components/weather-forecast-widget";

function toWeatherForecastLocations(savedLocations: SavedLocation[]): WeatherForecastLocation[] {
  return savedLocations.map((location) => ({
    states: { state_name: location.stateName },
    districts: { district: location.districtName },
  }));
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await getEmergencyData({ mode: "live" });

  const savedDistricts = data.savedLocations
    .map((loc) => loc.districtName.toLowerCase().trim())
    .filter(Boolean);

  const forecastLocations = toWeatherForecastLocations(data.savedLocations);

  // If user is not logged in, show all. If logged in, filter by their districts.
  const validAlerts = user
    ? data.shelters.filter((center) => savedDistricts.includes(center.daerah.toLowerCase().trim()))
    : data.shelters;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Header section */}
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Flood Alerts Overview
          </h1>
          <p className="text-foreground/60 mt-2 text-sm">
            Monitoring regional flood status and shelter availability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Alert Panel - spans 2 columns */}
          <div className="md:col-span-2 bg-panel border gap-2 border-border p-6 rounded-xl shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Active Alerts
            </h2>
            {(!validAlerts || validAlerts.length === 0) ? (
              <div className="mt-4 p-4 bg-background border border-border/50 rounded-lg flex flex-col items-center justify-center text-center min-h-[200px]">
                <p className="text-foreground/50 text-sm">
                  {user ? (
                    savedDistricts.length === 0
                      ? "You have no saved locations. Add some in your profile."
                      : "No active alerts in your saved districts."
                  ) : (
                    "Please sign in to view personalized alerts."
                  )}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {validAlerts.map((center) => (
                  <div key={center.id} className="bg-panel border border-border p-4 rounded-xl flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h2 className="font-semibold text-foreground text-sm leading-tight">{center.name}</h2>
                      <span className="text-xs font-medium bg-red-600 text-white px-2 py-0.5 border border-border rounded-md whitespace-nowrap">
                        {center.negeri}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70 flex-grow mt-2">
                      <div className="flex flex-col">
                        <span>Victims:</span>
                        <span className="text-foreground font-semibold text-sm">{center.mangsa}</span>
                      </div>
                      <div className="flex flex-col">
                        <span>Capacity:</span>
                        <span className="text-foreground font-semibold text-sm">{center.kapasiti}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-border/30 text-xs text-foreground/40 flex flex-col gap-2">
                      <span>District: {center.daerah} - {center.mukim}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-accent/80">Location: {center.latti}, {center.longi}</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${center.latti},${center.longi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-accent text-accent-foreground hover:bg-accent/90 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                          Go Now
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Status / Quick Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-panel border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold text-foreground/90 border-b border-border pb-2">
                User Account
              </h2>
              <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-background border border-border/50 rounded-lg">
                {!user ? (
                  <>
                    <p className="text-foreground/50 text-sm mb-4">You are not signed in.</p>
                    <Link href="/login" className="w-full bg-accent text-accent-foreground font-medium rounded-md py-2 px-4 text-sm hover:bg-accent/90 transition-all text-center block">
                      Sign In
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-foreground/90 font-medium text-sm mb-1">Signed In</p>
                    <p className="text-accent text-xs mb-4 truncate w-full">{user.email}</p>
                    <Link href="/map" className="w-full bg-foreground text-background font-medium rounded-md py-2 px-4 text-sm hover:bg-foreground/90 transition-all text-center block border border-foreground">
                      View Map
                    </Link>
                  </>
                )}
              </div>
            </div>

            <WeatherForecastWidget
              forecasts={data.weatherForecasts}
              locations={forecastLocations}
              maxItems={3}
            />
          </div>
        </div>
      </div>
      <LiveUpdateBar alerts={data.weatherAlerts} />
    </>
  );
}
