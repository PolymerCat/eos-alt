"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, CloudRain, Database, Home, MapPin, RefreshCw } from "lucide-react";
import { readPublicEmergencySnapshot } from "@/lib/pwa/emergency-snapshot-cache";
import { networkStatusStore } from "@/lib/pwa/network-status";
import type { PublicEmergencySnapshot } from "@/types/pwa";
import DisasterBadge from "@/components/shelters/DisasterBadge";

function formatCachedAt(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Standalone offline-first surface.
 *
 * It reads the latest public snapshot from IndexedDB and never displays
 * personal saved locations, contacts, notifications, or SOS history.
 */
export default function OfflineEmergencyHub() {
  const isOnline = useSyncExternalStore(
    networkStatusStore.subscribe,
    networkStatusStore.getSnapshot,
    networkStatusStore.getServerSnapshot
  );
  const [snapshot, setSnapshot] = useState<PublicEmergencySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readPublicEmergencySnapshot()
      .then(setSnapshot)
      .catch((error) => console.error("Failed to load offline emergency snapshot:", error))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Offline emergency hub
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Emergency OS Offline</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/65">
          This page shows the last public emergency snapshot cached on this device. It is not live
          data. Verify critical instructions with official agencies.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              isOnline
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            {isOnline ? "Connection available" : "Offline"}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry connection
          </button>
          {isOnline ? (
            <Link href="/" className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
              Return to live app
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Offline limitations</p>
            <p className="mt-1 leading-6">
              Map tiles, live weather, Supabase account data, and WhatsApp SOS delivery may not
              work without a connection. This hub intentionally does not cache personal data.
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-foreground/60">Checking this device for cached emergency data...</p>
      ) : snapshot ? (
        <>
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
              Last cached: {formatCachedAt(snapshot.cachedAt)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Shelters", value: snapshot.shelters.length, icon: Home },
                { label: "Weather alerts", value: snapshot.weatherAlerts.length, icon: CloudRain },
                { label: "Data sources", value: snapshot.dataSources.length, icon: Database },
              ].map((metric) => (
                <article key={metric.label} className="rounded-lg border border-border bg-panel p-4">
                  <metric.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <p className="mt-3 text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="mt-1 text-sm text-foreground/60">{metric.label}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Cached Shelters</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {snapshot.shelters.slice(0, 12).map((shelter) => (
                <article key={shelter.id} className="rounded-lg border border-border bg-panel p-4">
                  <h3 className="font-semibold text-foreground">{shelter.name}</h3>
                  <p className="mt-1 text-sm text-foreground/60">
                    {shelter.daerah}, {shelter.negeri}
                  </p>
                  <div className="mt-3">
                    <DisasterBadge shelter={shelter} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-foreground/55">
                    <span>{shelter.mangsa} victims</span>
                    <span>{shelter.kapasiti} capacity</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.latti},${shelter.longi}`}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-accent"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Open directions when available
                  </a>
                </article>
              ))}
              {snapshot.shelters.length === 0 ? (
                <p className="text-sm text-foreground/60">No shelter records were in the last cache.</p>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Cached Weather Alerts</h2>
            <div className="mt-3 flex flex-col gap-3">
              {snapshot.weatherAlerts.slice(0, 8).map((alert) => (
                <article key={alert.id} className="rounded-lg border border-border bg-panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground">{alert.title}</h3>
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-900">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground/65">{alert.description}</p>
                </article>
              ))}
              {snapshot.weatherAlerts.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  No weather alerts were in the last cache.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-border bg-panel p-6">
          <h2 className="font-bold text-foreground">No cached emergency snapshot found</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/60">
            Visit the Emergency OS overview while online once. The app will then store a public-only
            emergency snapshot for future offline use.
          </p>
        </section>
      )}
    </div>
  );
}
