"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { networkStatusStore } from "@/lib/pwa/network-status";

/**
 * Global connectivity notice. This does not decide which data is safe to use;
 * it only communicates that the browser currently reports no network access.
 */
export default function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    networkStatusStore.subscribe,
    networkStatusStore.getSnapshot,
    networkStatusStore.getServerSnapshot
  );

  if (isOnline) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>You are offline. Live emergency information may be unavailable.</span>
        </div>
        <Link href="/offline" className="shrink-0 font-semibold underline underline-offset-2">
          Offline hub
        </Link>
      </div>
    </div>
  );
}
