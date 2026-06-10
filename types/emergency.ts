import type { PPS, WeatherWarning, WeatherForecast } from "@/app/actions";
import type { EmergencyTimelineEvent } from "@/types/timeline";

export type DataMode = "live" | "simulation";

export type AlertSeverity = "advisory" | "watch" | "warning" | "critical";

export type DeliveryMethod = "App Notification" | "SMS" | "Email";

export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type SosStatus = "draft" | "submitted" | "sent" | "failed" | "cancelled";

export interface SavedLocation {
  id: number;
  userId: string;
  stateCode: number;
  stateName: string;
  districtId: number;
  districtName: string;
  label: string;
  description?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface WeatherAlert {
  id: string;
  source: "METMalaysia" | "NADMA" | "simulation";
  title: string;
  titleBm?: string;
  description: string;
  descriptionBm?: string;
  severity: AlertSeverity;
  affectedArea: string;
  issuedAt: string;
  validFrom?: string;
  validTo?: string;
}

export interface AlertPreference {
  id: string;
  userId: string;
  alertType: "weather" | "shelter" | "sos" | "government_notice";
  isEnabled: boolean;
  deliveryMethods: DeliveryMethod[];
}

export interface NotificationRecord {
  id: string;
  userId: string;
  weatherAlertId?: string;
  title: string;
  message: string;
  deliveryMethod: DeliveryMethod;
  status: DeliveryStatus;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  deliveryMethod: DeliveryMethod;
  isPrimary: boolean;
}

export interface SosRequest {
  id: string;
  userId: string;
  latitude?: number;
  longitude?: number;
  message: string;
  status: SosStatus;
  contactId?: string;
  createdAt: string;
}

export interface GovernmentNotice {
  id: string;
  agency: "NADMA" | "JKM" | "METMalaysia" | "Local Authority";
  title: string;
  body: string;
  publishedAt: string;
  affectedArea?: string;
}

export interface EmergencyReport {
  id: string;
  title: string;
  summary: string;
  generatedAt: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  type: "external_api" | "database" | "scheduled_job" | "simulation";
  status: "online" | "degraded" | "offline" | "simulated";
  lastCheckedAt: string;
  notes: string;
}

export interface EmergencyScenario {
  id: string;
  name: string;
  description: string;
  shelters: PPS[];
  weatherForecasts: WeatherForecast[];
  weatherAlerts: WeatherAlert[];
  savedLocations: SavedLocation[];
  alertPreferences: AlertPreference[];
  notifications: NotificationRecord[];
  sosRequests: SosRequest[];
  emergencyContacts: EmergencyContact[];
  governmentNotices: GovernmentNotice[];
  reports: EmergencyReport[];
  dataSources: DataSourceStatus[];
  timelineEvents?: EmergencyTimelineEvent[];
}

export interface EmergencyDataSnapshot {
  mode: DataMode;
  scenarioName?: string;
  shelters: PPS[];
  weatherForecasts: WeatherForecast[];
  weatherAlerts: WeatherAlert[];
  savedLocations: SavedLocation[];
  alertPreferences: AlertPreference[];
  notifications: NotificationRecord[];
  sosRequests: SosRequest[];
  emergencyContacts: EmergencyContact[];
  governmentNotices: GovernmentNotice[];
  reports: EmergencyReport[];
  dataSources: DataSourceStatus[];
}
