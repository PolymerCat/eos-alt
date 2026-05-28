import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import TestUiShell from "@/components/test-ui/TestUiShell";

export default async function TestUiReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });
  const report = data.reports[0];

  return (
    <TestUiShell
      title="Report Generation and Share Preview"
      description="Prototype for turning emergency data into a structured, shareable situation report."
      mode={mode}
      pathname="/test-ui/reports"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <PageSection title="Report Builder">
          <form className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <label className="text-sm font-medium text-foreground">Report type</label>
            <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option>Situation brief</option>
              <option>Shelter capacity report</option>
              <option>Saved location alert summary</option>
            </select>

            <label className="mt-4 block text-sm font-medium text-foreground">Audience</label>
            <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option>Public sharing</option>
              <option>Family update</option>
              <option>Operations team</option>
            </select>

            <button className="mt-5 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              Generate Preview
            </button>
          </form>
        </PageSection>

        <PageSection title="Shareable Preview">
          {report ? (
            <article className="rounded-lg border border-border bg-panel p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-foreground/50">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{report.title}</h2>
              <p className="mt-3 text-sm leading-6 text-foreground/65">{report.summary}</p>
              <div className="mt-6 flex flex-col gap-4">
                {report.sections.map((section) => (
                  <section key={section.heading} className="border-t border-border pt-4">
                    <h3 className="font-semibold text-foreground">{section.heading}</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/65">{section.body}</p>
                  </section>
                ))}
              </div>
            </article>
          ) : (
            <p className="rounded-lg border border-border bg-panel p-5 text-sm text-foreground/60">
              No report records available in this mode yet.
            </p>
          )}
        </PageSection>
      </div>
    </TestUiShell>
  );
}
