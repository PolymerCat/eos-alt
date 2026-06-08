"use client";

import { useState } from "react";
import StatusBadge from "@/components/test-ui/StatusBadge";
import type { SavedLocation, NotificationRecord, WeatherAlert } from "@/types/emergency";

interface AlertsTabsViewProps {
  savedLocations: SavedLocation[];
  notifications: NotificationRecord[];
  weatherAlerts: WeatherAlert[];
}

type TabType = "saved_locations" | "notifications" | "weather_alerts";

export default function AlertsTabsView({
  savedLocations,
  notifications,
  weatherAlerts,
}: AlertsTabsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("saved_locations");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">View Data</h2>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabType)}
          className="rounded-md border border-border bg-panel px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="saved_locations">Saved Locations</option>
          <option value="notifications">Personal Notifications</option>
          <option value="weather_alerts">Weather Alerts</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {activeTab === "saved_locations" && (
          <>
            {savedLocations.map((location) => (
              <article
                key={location.id}
                className="rounded-lg border border-border bg-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-primary/20"
              >
                <h3 className="font-semibold text-foreground">{location.label}</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  {location.districtName}, {location.stateName}
                </p>
                <p className="mt-3 text-xs font-mono text-foreground/50">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
              </article>
            ))}
            {savedLocations.length === 0 && (
              <p className="text-sm text-foreground/60">No saved locations found.</p>
            )}
          </>
        )}

        {activeTab === "notifications" && (
          <>
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-lg border border-border bg-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{notification.title}</h3>
                  <StatusBadge label={notification.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/65">{notification.message}</p>
                <p className="mt-3 text-xs text-foreground/50">Via {notification.deliveryMethod}</p>
              </article>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-foreground/60">No personal notifications found.</p>
            )}
          </>
        )}

        {activeTab === "weather_alerts" && (
          <>
            {weatherAlerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-lg border border-border bg-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                  <StatusBadge label={alert.severity} severity={alert.severity} />
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/65">{alert.description}</p>
                <p className="mt-3 text-xs text-foreground/50">Source: {alert.source}</p>
                <p className="mt-1 text-xs text-foreground/50">Affected: {alert.affectedArea}</p>
              </article>
            ))}
            {weatherAlerts.length === 0 && (
              <p className="text-sm text-foreground/60">No weather alerts found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
