import Link from "next/link";
import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import { getWeatherWarnings } from "../actions";
import PageSection from "@/components/test-ui/PageSection";
import StatCard from "@/components/test-ui/StatCard";
import TestUiShell from "@/components/test-ui/TestUiShell";
import Card from "@/components/test-ui/Card";
import { Home, MapPin } from "lucide-react";
import StatusBadge from "@/components/test-ui/StatusBadge";
import LiveUpdateBar from "@/components/live-update-bar";

const modules = [
  {
    href: "/test-ui/weather",
    title: "Weather Alerts",
    body: "METMalaysia-style warnings, severity display, and forecast summary components.",
  },
  {
    href: "/test-ui/alerts",
    title: "Personalized Alerts",
    body: "Saved-location matching, alert preferences, government notices, and notification history.",
  },
  {
    href: "/test-ui/sos",
    title: "SOS Alert",
    body: "Location capture, emergency contact selection, confirmation, and request status.",
  },
  {
    href: "/test-ui/reports",
    title: "Reports",
    body: "Generate and preview shareable situation summaries from the same emergency data snapshot.",
  },
];

export default async function TestUiHubPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });
  const weatherWarnings = await getWeatherWarnings();

  const isLive = mode === "live";
  const displayAlerts = isLive
    ? weatherWarnings.map((w, index) => ({
      id: `live-warning-${index}`,
      title: w.warning_issue?.title_en || w.heading_en || "Weather Alert",
      description: w.text_en || w.text_bm || "",
      severity: "warning" as const,
      affectedArea: w.warning_issue?.title_en || "Malaysia",
    }))
    : data.weatherAlerts;

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
      pathname="/test-ui"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Shelters" value={data.shelters.length} detail="Active or simulated PPS records" />
        <StatCard label="Weather" value={data.weatherWarnings.length + data.weatherAlerts.length} detail="Warning records available" />
        <StatCard label="Notifications" value={data.notifications.length} detail="Generated user alert records" />
        <StatCard label="SOS" value={data.sosRequests.length} detail="Emergency request records" />
      </div>


      <PageSection title="" description="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px]">
          {/* Column 1 (Left Side: takes 2/3 horizontal space) */}
          <div className="lg:col-span-2 grid grid-rows-3 gap-4 h-full">
            {/* Row 1 & 2: Personal Alerts */}
            <div className="row-span-2 h-full">
              <Card
                title="Personal Alerts"
                description="Current personal locations in emergency"
                className="h-full flex flex-col"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 flex-1 content-start overflow-hidden">
                  {data.notifications.slice(0, 4).map((notification) => (
                    <div key={notification.id} className="rounded-lg border border-border bg-panel/30 p-3 flex flex-col justify-between hover:border-accent/40 transition-colors">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground line-clamp-1">{notification.title}</h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-foreground/70 line-clamp-2">{notification.message}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-foreground/50 border-t border-border/50 pt-1">
                        <span>Via {notification.deliveryMethod}</span>
                        <span className="capitalize px-1.5 py-0.25 bg-accent/15 text-accent rounded-sm font-semibold">{notification.status}</span>
                      </div>
                    </div>
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
            <div className="row-span-1 h-full">
              <div className="grid grid-cols-2 gap-4 h-full">
                <Link href={`/test-ui/map?mode=${mode}`} className="block h-full">
                  <Card className="h-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/80 transition-colors group p-4">
                    <Home className="h-8 w-8 text-foreground/70 group-hover:text-accent transition-colors mb-2" />
                    <h1 className="text-base font-bold text-foreground">Shelters</h1>
                    <span className="text-xs font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full mt-1.5">
                      {data.shelters.length} Available
                    </span>
                  </Card>
                </Link>
                <Link href={`/test-ui/alerts?mode=${mode}`} className="block h-full">
                  <Card className="h-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/80 transition-colors group p-4">
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

          <div className="lg:col-span-1 h-full">
            <Card
              title="Weather Alerts"
              description="Weather warnings and alerts from MET Malaysia"
              className="h-full flex flex-col"
            >
              <div className="flex flex-col gap-2.5 mt-2 overflow-hidden flex-1">
                {displayAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-border bg-panel/30 p-2.5 flex flex-col gap-1 hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${getDotColor(alert.severity)}`}></span>
                      <h4 className="font-bold text-xs text-foreground line-clamp-1">{alert.title}</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/70 line-clamp-2 mt-0.5">{alert.description}</p>
                  </div>
                ))}
                {displayAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-foreground/55 text-xs italic">
                    No active weather warnings.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
                <Link
                  href={`/test-ui/weather?mode=${mode}`}
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


      <div className="pt-4"><LiveUpdateBar warnings={weatherWarnings} /></div>

    </TestUiShell>
  );
}
