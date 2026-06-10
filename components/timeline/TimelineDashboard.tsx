import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  CloudRain,
  MapPin,
} from "lucide-react";
import ActiveShelterGraph from "@/components/timeline/ActiveShelterGraph";
import type {
  EmergencyTimelineEvent,
  EmergencyTimelineSnapshot,
  TimelineEventType,
} from "@/types/timeline";

const EVENT_LABELS: Record<TimelineEventType, string> = {
  shelter_opened: "Shelter opened",
  shelter_closed: "Shelter closed",
  shelter_capacity_changed: "Capacity changed",
  weather_alert_issued: "Weather alert issued",
  weather_alert_expired: "Weather alert expired",
};

function formatEventTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEventPresentation(event: EmergencyTimelineEvent) {
  switch (event.eventType) {
    case "shelter_opened":
      return { icon: Building2, tone: "bg-emerald-600", label: EVENT_LABELS[event.eventType] };
    case "shelter_closed":
      return { icon: CheckCircle2, tone: "bg-slate-500", label: EVENT_LABELS[event.eventType] };
    case "weather_alert_issued":
      return { icon: AlertTriangle, tone: "bg-amber-600", label: EVENT_LABELS[event.eventType] };
    case "weather_alert_expired":
      return { icon: CloudRain, tone: "bg-blue-500", label: EVENT_LABELS[event.eventType] };
    default:
      return { icon: Clock3, tone: "bg-violet-600", label: EVENT_LABELS[event.eventType] };
  }
}

export default function TimelineDashboard({
  snapshot,
  selectedDays,
  selectedState,
  selectedEventType,
}: {
  snapshot: EmergencyTimelineSnapshot;
  selectedDays: number;
  selectedState?: string;
  selectedEventType?: TimelineEventType;
}) {
  const shelterEvents = snapshot.events.filter((event) => event.eventType.startsWith("shelter_"));
  const weatherEvents = snapshot.events.filter((event) => event.eventType.startsWith("weather_"));

  return (
    <div className="flex flex-col gap-6">
      <form
        method="get"
        className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-[180px_1fr_1fr_auto]"
      >
        <input type="hidden" name="mode" value={snapshot.mode} />
        <label className="text-xs font-semibold text-foreground/60">
          Date range
          <select
            name="days"
            defaultValue={String(selectedDays)}
            className="mt-1.5 w-full rounded-md border border-border bg-panel px-3 py-2.5 text-sm text-foreground"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-foreground/60">
          State
          <select
            name="state"
            defaultValue={selectedState ?? ""}
            className="mt-1.5 w-full rounded-md border border-border bg-panel px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">All states</option>
            {snapshot.availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-foreground/60">
          Event type
          <select
            name="eventType"
            defaultValue={selectedEventType ?? ""}
            className="mt-1.5 w-full rounded-md border border-border bg-panel px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">All events</option>
            {Object.entries(EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Apply filters
        </button>
      </form>

      {snapshot.note ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {snapshot.note}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Events", value: snapshot.events.length, detail: "Within selected range" },
          { label: "Shelter transitions", value: shelterEvents.length, detail: "Opened or closed" },
          { label: "Weather transitions", value: weatherEvents.length, detail: "Issued or expired" },
        ].map((metric) => (
          <article key={metric.label} className="border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase text-foreground/45">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{metric.value}</p>
            <p className="mt-1 text-xs text-foreground/55">{metric.detail}</p>
          </article>
        ))}
      </section>

      <ActiveShelterGraph points={snapshot.shelterCountSeries} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Chronological Events</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Newest first. Personal notifications and SOS records are excluded.
            </p>
          </div>
          <p className="text-xs font-semibold text-foreground/45">
            {formatEventTime(snapshot.rangeStart)} to {formatEventTime(snapshot.rangeEnd)}
          </p>
        </div>

        <div className="mt-5">
          {snapshot.events.length > 0 ? (
            <ol className="relative ml-3 border-l border-border">
              {snapshot.events.map((event) => {
                const presentation = getEventPresentation(event);
                const Icon = presentation.icon;
                return (
                  <li key={event.id} className="relative mb-6 pl-8 last:mb-0">
                    <span
                      className={`absolute -left-3.5 top-0 flex h-7 w-7 items-center justify-center rounded-full text-white ${presentation.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <article className="rounded-md border border-border bg-panel p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase text-foreground/45">
                            {presentation.label}
                          </p>
                          <h3 className="mt-1 font-semibold text-foreground">{event.title}</h3>
                        </div>
                        <time className="text-xs font-medium text-foreground/50">
                          {formatEventTime(event.occurredAt)}
                        </time>
                      </div>
                      {event.description ? (
                        <p className="mt-3 text-sm leading-6 text-foreground/65">
                          {event.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/55">
                        {event.disasterType ? (
                          <span className="rounded-md border border-border bg-background px-2 py-1">
                            {event.disasterType}
                          </span>
                        ) : null}
                        {event.district || event.state ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {[event.district, event.state].filter(Boolean).join(", ")}
                          </span>
                        ) : null}
                        {event.shelterId ? (
                          <Link
                            href={`/test-map?mode=${snapshot.mode}`}
                            className="font-semibold text-accent hover:underline"
                          >
                            View shelters on map
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-panel p-8 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-foreground/35" aria-hidden="true" />
              <p className="mt-3 font-semibold text-foreground">No timeline events found</p>
              <p className="mt-1 text-sm text-foreground/55">
                Try a wider range or remove one of the filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

