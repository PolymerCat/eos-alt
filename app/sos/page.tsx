import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatusBadge from "@/components/test-ui/StatusBadge";
import TestUiShell from "@/components/test-ui/TestUiShell";
import SosWorkspace from "@/components/sos/SosWorkspace";

export default async function TestUiSosPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = normalizeDataMode(params.mode);
  const data = await getEmergencyData({ mode });
  const draftRequest = data.sosRequests[0];

  return (
    <TestUiShell
      title="SOS Alert"
      description="Prototype for the SOS request flow: capture location, choose contact, review message, confirm send, and store status."
      mode={mode}
      pathname="/sos"
    >
      <SosWorkspace
        contacts={data.emergencyContacts}
        latestRequest={draftRequest}
        mode={mode}
      />

      <PageSection title="Current SOS Draft">
        {draftRequest ? (
          <article className="rounded-lg border border-border bg-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-foreground">{draftRequest.message}</h2>
              <StatusBadge label={draftRequest.status} />
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Coordinates: {draftRequest.latitude ?? "manual required"},{" "}
              {draftRequest.longitude ?? "manual required"}
            </p>
          </article>
        ) : (
          <p className="rounded-lg border border-border bg-panel p-5 text-sm text-foreground/60">
            No SOS request records available in this mode yet.
          </p>
        )}
      </PageSection>
    </TestUiShell>
  );
}
