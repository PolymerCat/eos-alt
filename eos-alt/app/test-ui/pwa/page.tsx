import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatCard from "@/components/test-ui/StatCard";
import TestUiShell from "@/components/test-ui/TestUiShell";

export default async function TestUiPwaPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });

  return (
    <TestUiShell
      title="Progressive Web App Readiness"
      description="Prototype for installability, offline fallback, cached scenario data, and clear mode communication."
      mode={mode}
      pathname="/test-ui/pwa"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Cached Shelters" value={data.shelters.length} detail="Can support offline fallback" />
        <StatCard label="Saved Locations" value={data.savedLocations.length} detail="Useful without live API" />
        <StatCard label="Mode" value={mode} detail="Visible to prevent confusion" />
      </div>

      <PageSection title="Expected PWA States">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              title: "Online live mode",
              body: "Fetch current government API records and current Supabase personalization data.",
            },
            {
              title: "Online simulation mode",
              body: "Use scenario data for demos, training, FYP review, and no-emergency testing.",
            },
            {
              title: "Offline fallback",
              body: "Show the last cached emergency snapshot with a strong offline warning.",
            },
            {
              title: "Installable app",
              body: "Keep the app reachable from mobile home screens during emergency preparation.",
            },
          ].map((state) => (
            <article key={state.title} className="rounded-lg border border-border bg-panel p-5 shadow-sm">
              <h2 className="font-bold text-foreground">{state.title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/65">{state.body}</p>
            </article>
          ))}
        </div>
      </PageSection>
    </TestUiShell>
  );
}
