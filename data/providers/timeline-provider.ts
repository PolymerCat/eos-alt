import { getLiveEmergencyTimeline } from "@/data/providers/live-timeline-provider";
import { getSimulationEmergencyTimeline } from "@/data/providers/simulation-timeline-provider";
import type { EmergencyTimelineSnapshot, TimelineQuery } from "@/types/timeline";

export async function getEmergencyTimeline(
  query: TimelineQuery
): Promise<EmergencyTimelineSnapshot> {
  return query.mode === "live"
    ? getLiveEmergencyTimeline(query)
    : getSimulationEmergencyTimeline(query);
}

