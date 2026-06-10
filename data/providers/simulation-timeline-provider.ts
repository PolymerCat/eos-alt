import { getActiveSimulationScenario } from "@/app/profile/sim-actions";
import { defaultScenario } from "@/data/mock/emergency-scenarios";
import { buildShelterCountSeries } from "@/lib/timeline/build-shelter-count-series";
import type { EmergencyScenario } from "@/types/emergency";
import type {
  EmergencyTimelineEvent,
  EmergencyTimelineSnapshot,
  TimelineQuery,
} from "@/types/timeline";

export async function getSimulationEmergencyTimeline(
  query: TimelineQuery
): Promise<EmergencyTimelineSnapshot> {
  let scenario: EmergencyScenario = defaultScenario;

  try {
    const activeScenario = await getActiveSimulationScenario();
    if (activeScenario?.data) {
      scenario = activeScenario.data as EmergencyScenario;
    }
  } catch (error) {
    // Simulation remains usable for signed-out users and during database outages.
    console.error("Unable to load active simulation timeline scenario:", error);
  }

  const allEvents = scenario.timelineEvents ?? [];
  const latestTime = Math.max(...allEvents.map((event) => new Date(event.occurredAt).getTime()));
  const rangeEnd = new Date(Number.isFinite(latestTime) ? latestTime : Date.now());
  const rangeStart = new Date(rangeEnd.getTime() - query.days * 24 * 60 * 60 * 1000);

  const beforeRange = allEvents
    .filter((event) => new Date(event.occurredAt).getTime() < rangeStart.getTime())
    .filter((event) => !query.state || event.state === query.state);
  const initialActiveShelters = beforeRange.reduce(
    (count, event) =>
      count +
      (event.eventType === "shelter_opened"
        ? 1
        : event.eventType === "shelter_closed"
          ? -1
          : 0),
    0
  );

  const events: EmergencyTimelineEvent[] = allEvents
    .filter((event) => {
      const occurredAt = new Date(event.occurredAt).getTime();
      return occurredAt >= rangeStart.getTime() && occurredAt <= rangeEnd.getTime();
    })
    .filter((event) => !query.state || event.state === query.state)
    .filter((event) => !query.eventType || event.eventType === query.eventType)
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  const graphEvents = allEvents
    .filter((event) => {
      const occurredAt = new Date(event.occurredAt).getTime();
      return occurredAt >= rangeStart.getTime() && occurredAt <= rangeEnd.getTime();
    })
    .filter((event) => !query.state || event.state === query.state)
    .filter(
      (event) =>
        event.eventType === "shelter_opened" || event.eventType === "shelter_closed"
    );

  return {
    mode: "simulation",
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    events,
    shelterCountSeries: buildShelterCountSeries(
      graphEvents,
      rangeStart.toISOString(),
      Math.max(0, initialActiveShelters)
    ),
    initialActiveShelters: Math.max(0, initialActiveShelters),
    availableStates: Array.from(
      new Set(allEvents.map((event) => event.state).filter(Boolean))
    ) as string[],
    dataAvailable: true,
    note: `Simulation timeline uses events from the "${scenario.name}" scenario.`,
  };
}
