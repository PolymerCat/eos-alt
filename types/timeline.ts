import type { DataMode } from "@/types/emergency";

export type TimelineEventType =
  | "shelter_opened"
  | "shelter_closed"
  | "shelter_capacity_changed"
  | "weather_alert_issued"
  | "weather_alert_expired";

export interface EmergencyTimelineEvent {
  id: string;
  eventType: TimelineEventType;
  occurredAt: string;
  endedAt?: string;
  shelterId?: string;
  weatherAlertId?: string;
  disasterType?: string;
  state?: string;
  district?: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  source: string;
}

export interface TimelineShelterCountPoint {
  occurredAt: string;
  activeShelters: number;
  eventType: "baseline" | "shelter_opened" | "shelter_closed";
}

export interface EmergencyTimelineSnapshot {
  mode: DataMode;
  rangeStart: string;
  rangeEnd: string;
  events: EmergencyTimelineEvent[];
  shelterCountSeries: TimelineShelterCountPoint[];
  initialActiveShelters: number;
  availableStates: string[];
  dataAvailable: boolean;
  note?: string;
}

export interface TimelineQuery {
  mode: DataMode;
  days: number;
  state?: string;
  eventType?: TimelineEventType;
}

