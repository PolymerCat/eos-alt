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
    <article className="rounded-lg border border-border bg-panel p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-foreground/50">
            Generated {formatReportDate(report.generatedAt)}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{report.title}</h2>
        </div>
        <StatusBadge label={report.mode} />
      </div>

      <p className="mt-4 text-sm leading-6 text-foreground/70">{report.summary}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {report.metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-border bg-background p-3">
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
          <section key={section.heading} className="border-t border-border pt-4">
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
          </section>
        ))}
      </div>

      <p className="mt-6 rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground/60">
        {report.disclaimer}
      </p>
    </article>
  );
}
