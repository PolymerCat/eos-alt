import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import ShelterCard from "@/components/test-ui/ShelterCard";
import StatCard from "@/components/test-ui/StatCard";
import TestUiShell from "@/components/test-ui/TestUiShell";

export default async function TestUiMapPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });
  const selectedShelter = data.shelters[0];

  return (
    <TestUiShell
      title="Interactive Emergency Map"
      description="Prototype for the full-screen map experience: shelter panel, map overlays, weather widget, selected shelter detail, and nearest shelter action."
      mode={mode}
      pathname="/test-ui/map"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Shelters" value={data.shelters.length} detail="Open records" />
            <StatCard label="Warnings" value={data.weatherAlerts.length} detail="Weather feed" />
          </div>
          <PageSection title="Shelter List" description="Google Maps-style left panel.">
            <div className="flex max-h-[620px] flex-col gap-3 overflow-y-auto pr-1">
              {data.shelters.map((shelter) => (
                <ShelterCard key={shelter.id} shelter={shelter} />
              ))}
            </div>
          </PageSection>
        </aside>

        <section className="relative min-h-[680px] overflow-hidden rounded-lg border border-border bg-[#dbeafe] shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,235,0.12)_1px,transparent_1px),linear-gradient(rgba(37,99,235,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute left-[18%] top-[30%] h-4 w-4 rounded-full border-2 border-white bg-red-600 shadow-lg" />
          <div className="absolute left-[54%] top-[46%] h-4 w-4 rounded-full border-2 border-white bg-red-600 shadow-lg" />
          <div className="absolute left-[68%] top-[28%] h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow-lg" />

          <div className="absolute left-4 top-4 rounded-lg border border-border bg-panel p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-foreground/50">Map Controls</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-md bg-background px-2 py-1">Shelters</span>
              <span className="rounded-md bg-background px-2 py-1">Weather</span>
              <span className="rounded-md bg-background px-2 py-1">Saved Locations</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 w-[min(360px,calc(100%-2rem))] rounded-lg border border-border bg-panel p-4 shadow-lg">
            <p className="text-xs font-semibold uppercase text-accent">Selected Shelter</p>
            {selectedShelter ? (
              <>
                <h2 className="mt-2 text-base font-bold text-foreground">{selectedShelter.name}</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  {selectedShelter.daerah}, {selectedShelter.negeri}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <span>Victims: {selectedShelter.mangsa}</span>
                  <span>Families: {selectedShelter.keluarga}</span>
                  <span>{selectedShelter.kapasiti}</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-foreground/60">No shelter selected.</p>
            )}
          </div>
        </section>
      </div>
    </TestUiShell>
  );
}
