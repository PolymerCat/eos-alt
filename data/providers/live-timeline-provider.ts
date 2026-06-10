import { createClient } from "@/utils/supabase/server";
import { buildShelterCountSeries } from "@/lib/timeline/build-shelter-count-series";
import type {
  EmergencyTimelineEvent,
  EmergencyTimelineSnapshot,
  TimelineEventType,
  TimelineQuery,
} from "@/types/timeline";

type TimelineEventRow = {
  id: string;
  event_type: TimelineEventType;
  occurred_at: string;
  ended_at: string | null;
  shelter_id: string | null;
  weather_alert_id: string | null;
  disaster_type: string | null;
  state: string | null;
  district: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  source: string;
};

function mapTimelineEvent(row: TimelineEventRow): EmergencyTimelineEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    endedAt: row.ended_at ?? undefined,
    shelterId: row.shelter_id ?? undefined,
    weatherAlertId: row.weather_alert_id ?? undefined,
    disasterType: row.disaster_type ?? undefined,
    state: row.state ?? undefined,
    district: row.district ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    metadata: row.metadata ?? {},
    source: row.source,
  };
}

export async function getLiveEmergencyTimeline(
  query: TimelineQuery
): Promise<EmergencyTimelineSnapshot> {
  const supabase = await createClient();
  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - query.days * 24 * 60 * 60 * 1000);

  let eventsQuery = supabase
    .from("emergency_timeline_events")
    .select("*")
    .gte("occurred_at", rangeStart.toISOString())
    .lte("occurred_at", rangeEnd.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (query.state) eventsQuery = eventsQuery.eq("state", query.state);
  if (query.eventType) eventsQuery = eventsQuery.eq("event_type", query.eventType);

  let graphEventsQuery = supabase
    .from("emergency_timeline_events")
    .select("*")
    .in("event_type", ["shelter_opened", "shelter_closed"])
    .gte("occurred_at", rangeStart.toISOString())
    .lte("occurred_at", rangeEnd.toISOString())
    .order("occurred_at", { ascending: true })
    .limit(1000);

  if (query.state) graphEventsQuery = graphEventsQuery.eq("state", query.state);

  let baselineQuery = supabase
    .from("emergency_timeline_events")
    .select("event_type")
    .in("event_type", ["shelter_opened", "shelter_closed"])
    .lt("occurred_at", rangeStart.toISOString())
    .limit(5000);

  if (query.state) baselineQuery = baselineQuery.eq("state", query.state);

  const [eventsResult, graphEventsResult, baselineResult, statesResult] = await Promise.all([
    eventsQuery,
    graphEventsQuery,
    baselineQuery,
    supabase
      .from("emergency_timeline_events")
      .select("state")
      .not("state", "is", null)
      .order("state")
      .limit(1000),
  ]);

  if (eventsResult.error || graphEventsResult.error || baselineResult.error || statesResult.error) {
    return {
      mode: "live",
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      events: [],
      shelterCountSeries: buildShelterCountSeries([], rangeStart.toISOString(), 0),
      initialActiveShelters: 0,
      availableStates: [],
      dataAvailable: false,
      note:
        "Timeline storage is unavailable. Apply migration 011 and deploy the updated sync-live-data function.",
    };
  }

  const events = ((eventsResult.data ?? []) as TimelineEventRow[]).map(mapTimelineEvent);
  const graphEvents = ((graphEventsResult.data ?? []) as TimelineEventRow[]).map(mapTimelineEvent);
  const initialActiveShelters = (baselineResult.data ?? []).reduce(
    (count, event) =>
      count + (event.event_type === "shelter_opened" ? 1 : -1),
    0
  );
  const availableStates = Array.from(
    new Set((statesResult.data ?? []).map((row) => row.state).filter(Boolean))
  ) as string[];

  return {
    mode: "live",
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    events,
    shelterCountSeries: buildShelterCountSeries(
      graphEvents,
      rangeStart.toISOString(),
      Math.max(0, initialActiveShelters)
    ),
    initialActiveShelters: Math.max(0, initialActiveShelters),
    availableStates,
    dataAvailable: true,
  };
}
