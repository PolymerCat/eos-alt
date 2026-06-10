import type { TimelineShelterCountPoint } from "@/types/timeline";

function formatGraphTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Accessible, dependency-free shelter-count graph.
 *
 * Each column represents a real shelter transition. The visual height shows
 * the resulting number of active shelters, while the text label preserves the
 * exact value for screen readers and low-vision users.
 */
export default function ActiveShelterGraph({
  points,
}: {
  points: TimelineShelterCountPoint[];
}) {
  const visiblePoints = points.slice(-48);
  const maximum = Math.max(1, ...visiblePoints.map((point) => point.activeShelters));

  return (
    <section className="border-b border-border pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Active Shelters Over Time</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Changes are based on verified shelter open and close events.
          </p>
        </div>
        <p className="text-xs font-semibold text-foreground/50">
          Peak: {maximum} active shelter{maximum === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div
          className="grid h-64 min-w-[680px] items-end gap-2 border-b border-l border-border px-3 pt-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(32px, 1fr))`,
          }}
          role="img"
          aria-label="Active shelter count timeline"
        >
          {visiblePoints.map((point, index) => {
            const height = Math.max(4, (point.activeShelters / maximum) * 190);
            return (
              <div
                key={`${point.occurredAt}-${index}`}
                className="flex h-full min-w-0 flex-col items-center justify-end"
                title={`${formatGraphTime(point.occurredAt)}: ${point.activeShelters} active shelters`}
              >
                <span className="mb-1 text-[11px] font-bold text-foreground">
                  {point.activeShelters}
                </span>
                <div
                  className={`w-full max-w-10 rounded-t-sm ${
                    point.eventType === "shelter_closed"
                      ? "bg-slate-500"
                      : point.eventType === "shelter_opened"
                        ? "bg-emerald-600"
                        : "bg-blue-500"
                  }`}
                  style={{ height }}
                />
                <span className="mt-2 line-clamp-2 text-center text-[9px] leading-3 text-foreground/45">
                  {formatGraphTime(point.occurredAt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

