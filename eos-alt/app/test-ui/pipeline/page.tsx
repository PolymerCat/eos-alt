import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatusBadge from "@/components/test-ui/StatusBadge";
import TestUiShell from "@/components/test-ui/TestUiShell";

export default async function TestUiPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Government Agency Data Pipeline"
      description="Prototype for admin/developer visibility into source health, extraction, transformation, and storage."
      mode={mode}
      pathname="/test-ui/pipeline"
    >
      <PageSection title="Source Status Board">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.dataSources.map((source) => (
            <article key={source.id} className="rounded-lg border border-border bg-panel p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-foreground/50">{source.type}</p>
                  <h2 className="mt-2 font-bold text-foreground">{source.name}</h2>
                </div>
                <StatusBadge label={source.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/65">{source.notes}</p>
              <p className="mt-4 text-xs text-foreground/50">
                Last checked {new Date(source.lastCheckedAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="Pipeline Flow">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {["Gather agency data", "Transform records", "Store normalized data", "Serve UI snapshot"].map(
            (step, index) => (
              <div key={step} className="rounded-lg border border-border bg-panel p-4 shadow-sm">
                <p className="text-xs font-semibold text-accent">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
              </div>
            )
          )}
        </div>
      </PageSection>
    </TestUiShell>
  );
}
