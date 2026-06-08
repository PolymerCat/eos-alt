import type { PPS } from "@/app/actions";
import type { DataSourceStatus, WeatherAlert } from "@/types/emergency";

/**
 * Public-only emergency data that is safe to cache on the user's device.
 *
 * Personal fields such as saved locations, contacts, notifications, profile
 * details, and SOS requests are intentionally excluded from this contract.
 */
export interface PublicEmergencySnapshot {
  cachedAt: string;
  mode: "live";
  shelters: PPS[];
  weatherAlerts: WeatherAlert[];
  dataSources: DataSourceStatus[];
}
