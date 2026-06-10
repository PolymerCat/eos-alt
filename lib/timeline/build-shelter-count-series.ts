import type { EmergencyTimelineEvent, TimelineShelterCountPoint } from "@/types/timeline";

/**
 * Builds an ordered active-shelter count series from immutable open/close
 * events. The baseline represents shelters already active before the selected
 * range, preventing the graph from incorrectly starting at zero.
 */
export function buildShelterCountSeries(
  events: EmergencyTimelineEvent[],
  rangeStart: string,
  initialActiveShelters: number
): TimelineShelterCountPoint[] {
  let activeShelters = Math.max(0, initialActiveShelters);
  const points: TimelineShelterCountPoint[] = [
    {
      occurredAt: rangeStart,
      activeShelters,
      eventType: "baseline",
    },
  ];

  const shelterTransitions = events
    .filter(
      (event) =>
        event.eventType === "shelter_opened" || event.eventType === "shelter_closed"
    )
    .sort(
      (left, right) =>
        new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
    );

  for (const event of shelterTransitions) {
    const eventType =
      event.eventType === "shelter_opened" ? "shelter_opened" : "shelter_closed";
    activeShelters = Math.max(
      0,
      activeShelters + (eventType === "shelter_opened" ? 1 : -1)
    );
    points.push({
      occurredAt: event.occurredAt,
      activeShelters,
      eventType,
    });
  }

  return points;
}
