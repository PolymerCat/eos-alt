import type { GeneratedReport } from "@/types/reporting";
import StatusBadge from "@/components/test-ui/StatusBadge";
import { Bell, CloudRain, Database, Home, MapPin, Users } from "lucide-react";

interface ReportPreviewProps {
  report: GeneratedReport;
}

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getIcon(icon: string) {
  switch (icon) {
    case "weather":
      return CloudRain;
    case "people":
      return Users;
    case "location":
      return MapPin;
    case "database":
      return Database;
    case "shelter":
      return Home;
    default:
      return Bell;
  }
}

export default function ReportPreview({ report }: ReportPreviewProps) {
  return (
    <article className="report-print-root rounded-lg border border-border bg-panel p-5 shadow-sm sm:p-6">
      <div className="report-print-header flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-foreground/50">
            Generated {formatReportDate(report.generatedAt)}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{report.title}</h2>
        </div>
        <StatusBadge label={report.mode} />
      </div>

      <p className="mt-4 text-sm leading-6 text-foreground/70">{report.summary}</p>

      <dl className="report-print-metrics mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {report.metrics.map((metric) => (
          <div key={metric.label} className="report-print-metric rounded-md border border-border bg-background p-3">
            <dt className="flex items-center gap-2 text-xs font-semibold text-foreground/50">
              {(() => {
                const Icon = getIcon(metric.icon);
                return <Icon className="h-3.5 w-3.5 text-accent" />;
              })()}
              {metric.label}
            </dt>
            <dd className="mt-2 text-lg font-bold text-foreground">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-4">
        {report.sections.map((section) => (
          <section key={section.heading} className="report-print-section border-t border-border pt-4">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getIcon(section.icon);
                return (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                );
              })()}
              <h3 className="font-semibold text-foreground">{section.heading}</h3>
            </div>
            <ul className="mt-3 grid gap-2">
              {section.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-6 text-foreground/65">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {section.icon === "shelter" ? (
              <div className="report-print-shelters mt-4 grid gap-3 md:grid-cols-2">
                {report.onlineShelters.length > 0 ? (
                  report.onlineShelters.map((shelter) => (
                    <article key={shelter.id} className="report-print-shelter rounded-md border border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        <span
                          aria-label="Online shelter"
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold leading-5 text-foreground">{shelter.name}</h4>
                          <p className="mt-1 text-sm text-foreground/60">
                            {shelter.state} / {shelter.district}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-foreground/70">
                            Emergency: {shelter.disasterType}
                          </p>
                          <p className="mt-2 text-xs font-medium text-foreground/50">
                            {shelter.latitude}, {shelter.longitude}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md border border-border bg-background p-3 text-sm text-foreground/60">
                    No online shelters listed.
                  </p>
                )}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <p className="mt-6 rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground/60">
        {report.disclaimer}
      </p>
    </article>
  );
}
