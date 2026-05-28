import { getEmergencyData, normalizeDataMode } from "@/data/providers/emergency-data-provider";
import PageSection from "@/components/test-ui/PageSection";
import StatusBadge from "@/components/test-ui/StatusBadge";
import TestUiShell from "@/components/test-ui/TestUiShell";

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
      pathname="/test-ui/sos"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Emergency Action</p>
          <h2 className="mt-3 text-3xl font-bold text-red-700">Send SOS Request</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-700/75">
            The production version should require confirmation, show the selected location,
            and clearly identify whether the request is simulated or real.
          </p>
          <button className="mt-8 rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm">
            Hold to Confirm SOS
          </button>
        </section>

        <PageSection title="Emergency Contacts">
          <div className="flex flex-col gap-3">
            {data.emergencyContacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-foreground">{contact.name}</h2>
                    <p className="mt-1 text-sm text-foreground/60">{contact.role}</p>
                  </div>
                  {contact.isPrimary ? <StatusBadge label="Primary" /> : null}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{contact.phoneNumber}</p>
              </article>
            ))}
          </div>
        </PageSection>
      </div>

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
