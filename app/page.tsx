import Link from "next/link";
import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import type { SavedLocation } from "@/types/emergency";
import PageSection from "@/components/test-ui/PageSection";
import StatCard from "@/components/test-ui/StatCard";
import TestUiShell from "@/components/test-ui/TestUiShell";
import Card from "@/components/test-ui/Card";
import { Home, MapPin } from "lucide-react";
import LiveUpdateBar from "@/components/live-update-bar";
import DataSyncButton from "@/components/DataSyncButton";
import WeatherForecastWidget, { WeatherForecastLocation } from "@/components/weather-forecast-widget";
import DetailsModal from "@/components/test-ui/DetailsModal";

function toWeatherForecastLocations(savedLocations: SavedLocation[]): WeatherForecastLocation[] {
  return savedLocations.map((location) => ({
    states: { state_name: location.stateName },
    districts: { district: location.districtName },
  }));
}

export default async function TestUiHubPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });
  const forecastLocations = toWeatherForecastLocations(data.savedLocations);

  const isLive = mode === "live";
  const displayAlerts = data.weatherAlerts;

  const getDotColor = (severity: string) => {
    if (severity === "critical") return "bg-red-500";
    if (severity === "warning") return "bg-amber-500";
    if (severity === "watch") return "bg-blue-500";
    return "bg-slate-500";
  };

  return (
    <TestUiShell
      title="Emergency OS Dashboard"
      description="A review area for future Emergency OS modules. Every card uses the switchable data provider so live data and simulation scenarios can coexist."
      mode={mode}
      pathname="/"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Shelters" value={data.shelters.length} detail="Active or simulated PPS records" mode={mode} />
        <StatCard label="Weather" value={data.weatherAlerts.length} detail="Warning records available" mode={mode} />
        <StatCard label="Notifications" value={data.notifications.length} detail="Generated user alert records" mode={mode} />
        <StatCard label="SOS" value={data.sosRequests.length} detail="Emergency request records" mode={mode} />
      </div>

      {/* Manual sync button — only in live mode */}
      {isLive && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Live Data Sync</p>
            <p className="text-xs text-foreground/50 mt-0.5">
              Shelter and weather data is synced automatically every 10 min. Trigger manually if needed.
            </p>
          </div>
          <DataSyncButton />
        </div>
      )}


      <PageSection title="" description="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px]">
          {/* Column 1 (Left Side: takes 2/3 horizontal space) */}
          <div className="lg:col-span-2 flex flex-col lg:grid lg:grid-rows-3 gap-4 h-full">
            {/* Row 1 & 2: Personal Alerts */}
            <div className="lg:row-span-2 lg:h-full">
              <Card
                title="Personal Alerts"
                description="Current personal locations in emergency"
                className="h-full flex flex-col"
                mode={mode}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 flex-1 content-start overflow-hidden">
                  {data.notifications.slice(0, 6).map((notification) => (
                    <DetailsModal
                      key={notification.id}
                      modalTitle={notification.title}
                      modalContent={
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="capitalize px-3 py-1 bg-accent/15 text-accent rounded-md font-semibold">{notification.status}</span>
                            <span className="text-foreground/60">Delivered via {notification.deliveryMethod}</span>
                            <span className="text-foreground/50 text-sm ml-auto">
                              {new Date(notification.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="bg-panel/50 p-6 rounded-lg border border-border/50">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                          </div>
                        </div>
                      }
                    >
                      <div className="rounded-lg border border-border bg-panel/30 p-3 flex flex-col justify-between hover:border-accent/40 transition-colors h-full">
                        <div>
                          <h4 className="font-semibold text-xs text-foreground line-clamp-1">{notification.title}</h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-foreground/70 line-clamp-2">{notification.message}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-foreground/50 border-t border-border/50 pt-1">
                          <span>Via {notification.deliveryMethod}</span>
                          <span className="capitalize px-1.5 py-0.25 bg-accent/15 text-accent rounded-sm font-semibold">{notification.status}</span>
                        </div>
                      </div>
                    </DetailsModal>
                  ))}
                  {data.notifications.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-10 text-foreground/55 text-xs italic">
                      No recent personal alerts.
                    </div>
                  )}
                </div>
              </Card>
            </div>
            {/* Row 3: 2 cards side by side */}
            <div className="lg:row-span-1 lg:h-full">
              <div className="grid grid-cols-2 gap-4 lg:h-full">
                <Link href={`/shelters?mode=${mode}`} className="block lg:h-full">
                  <Card
                    className="aspect-square lg:aspect-auto lg:h-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/80 transition-colors group p-4"
                    mode={mode}
                  >
                    <Home className="h-8 w-8 text-foreground/70 group-hover:text-accent transition-colors mb-2" />
                    <h1 className="text-base font-bold text-foreground">Shelters</h1>
                    <span className="text-xs font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full mt-1.5">
                      {data.shelters.length} Available
                    </span>
                  </Card>
                </Link>
                <Link href={`/alerts?mode=${mode}`} className="block lg:h-full">
                  <Card
                    className="aspect-square lg:aspect-auto lg:h-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/80 transition-colors group p-4"
                    mode={mode}
                  >
                    <MapPin className="h-8 w-8 text-foreground/70 group-hover:text-accent transition-colors mb-2" />
                    <h1 className="text-base font-bold text-foreground">Saved Locations</h1>
                    <span className="text-xs font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full mt-1.5">
                      {data.savedLocations.length} Places
                    </span>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 h-full flex flex-col gap-4">
            <WeatherForecastWidget
              forecasts={data.weatherForecasts}
              locations={forecastLocations}
              maxItems={2}
              className="shrink-0"
              mode={mode}
            />

            <Card
              title="Weather Alerts"
              description="Weather warnings and alerts from MET Malaysia"
              className="flex-1 min-h-0 flex flex-col"
              mode={mode}
            >
              <div className="flex flex-col gap-2.5 mt-2 overflow-hidden flex-1">
                {displayAlerts.slice(0, 4).map((alert) => (
                  <DetailsModal
                    key={alert.id}
                    modalTitle={alert.title}
                    modalContent={
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <span className={`capitalize px-3 py-1 rounded-md font-semibold text-white ${getDotColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-foreground/60 font-medium">Source: {alert.source}</span>
                          <span className="text-foreground/50 text-sm ml-auto">
                            Issued: {new Date(alert.issuedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div className="bg-panel/50 p-6 rounded-lg border border-border/50">
                          <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-2">Affected Areas</h4>
                          <p className="text-base text-foreground mb-6">{alert.affectedArea}</p>
                          
                          <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-2">Description</h4>
                          <p className="text-lg leading-relaxed whitespace-pre-wrap">{alert.description}</p>
                        </div>
                      </div>
                    }
                  >
                    <div className="rounded-lg border border-border bg-panel/30 p-2.5 flex flex-col gap-1 hover:border-accent/40 transition-colors h-full">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${getDotColor(alert.severity)}`}></span>
                        <h4 className="font-bold text-xs text-foreground line-clamp-1">{alert.title}</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground/70 line-clamp-2 mt-0.5">{alert.description}</p>
                    </div>
                  </DetailsModal>
                ))}
                {displayAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-foreground/55 text-xs italic">
                    No active weather warnings.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
                <Link
                  href={`/weather?mode=${mode}`}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 group"
                >
                  All weather alerts
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* #region SAMPLE CODE */}
      {/* <PageSection title="Flexible Card Showcase" description="Examples showing the versatility of the new flexible Card component.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card
            title="Standard Info Card"
            description="A default layout with a title and a description. Useful for presenting general text-based content."
          />

          <Card
            title="Card with Action Items"
            description="This card includes custom children for interactive elements like buttons and lists."
          >
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-border pb-1">
                <span>Task status</span>
                <span className="text-emerald-500 font-semibold">Active</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="px-3 py-1 bg-foreground text-background rounded text-xs hover:opacity-90">
                  Enable
                </button>
              </div>
            </div>
          </Card>

          <Card className="border-accent bg-accent/5">
            <div className="flex flex-col h-full justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 bg-accent/20 text-accent rounded text-[10px] font-bold uppercase tracking-wider mb-2">
                  Highlight
                </span>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  Fully Customized Layout
                </h3>
                <p className="mt-1 text-sm text-foreground/70 leading-relaxed">
                  No title or description props passed. All layouts and content are passed as children, with custom border/background classes.
                </p>
              </div>
              <div className="mt-4 text-xs text-foreground/50 italic">
                Custom styled container
              </div>
            </div>
          </Card>
        </div>
      </PageSection> */}
      {/* #endregion */}


      <div className="pt-4"><LiveUpdateBar alerts={data.weatherAlerts} /></div>

    </TestUiShell>
  );
}
