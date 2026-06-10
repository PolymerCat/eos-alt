import TestUiShell from "@/components/test-ui/TestUiShell";
import TimelineDashboard from "@/components/timeline/TimelineDashboard";
import { normalizeDataMode } from "@/data/providers/emergency-data-provider";
import { getEmergencyTimeline } from "@/data/providers/timeline-provider";
import type { TimelineEventType } from "@/types/timeline";

const VALID_DAYS = new Set([1, 7, 30, 90]);
const VALID_EVENT_TYPES = new Set<TimelineEventType>([
  "shelter_opened",
  "shelter_closed",
  "shelter_capacity_changed",
  "weather_alert_issued",
  "weather_alert_expired",
]);

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    days?: string;
    state?: string;
    eventType?: string;
  }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const requestedDays = Number.parseInt(params.days ?? "30", 10);
  const days = VALID_DAYS.has(requestedDays) ? requestedDays : 30;
  const state = params.state?.trim() || undefined;
  const eventType = VALID_EVENT_TYPES.has(params.eventType as TimelineEventType)
    ? (params.eventType as TimelineEventType)
    : undefined;
  const timeline = await getEmergencyTimeline({ mode, days, state, eventType });

  return (
    <TestUiShell
      title="Emergency Timeline"
      description="Review when public emergencies were issued or expired and when shelters opened or closed."
      mode={mode}
      pathname="/timeline"
    >
      <TimelineDashboard
        snapshot={timeline}
        selectedDays={days}
        selectedState={state}
        selectedEventType={eventType}
      />
    </TestUiShell>
  );
}

