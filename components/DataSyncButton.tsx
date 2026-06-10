"use client";

import { useTransition, useState } from "react";
import { triggerLiveDataSync } from "@/app/actions/sync";
import { toast } from "sonner";

interface DataSyncButtonProps {
  /** Show compact icon-only version for tight spaces like navbars */
  compact?: boolean;
}

export default function DataSyncButton({ compact = false }: DataSyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  function handleSync() {
    startTransition(async () => {
      try {
        const result = await triggerLiveDataSync();

        const hadErrors = result.errors.length > 0;
        const shelterMsg = `${result.sheltersUpserted} shelter(s)`;
        const alertMsg = `${result.weatherAlertsUpserted} weather alert(s)`;

        if (hadErrors) {
          toast.warning("Sync completed with warnings", {
            description: `${shelterMsg}, ${alertMsg} synced. Issues: ${result.errors.join("; ")}`,
          });
        } else {
          toast.success("Live data synced", {
            description: `${shelterMsg} and ${alertMsg} updated from government APIs.`,
          });
        }

        setLastSynced(new Date(result.syncedAt));
      } catch (err) {
        toast.error("Sync failed", {
          description: err instanceof Error ? err.message : "Could not reach sync service.",
        });
      }
    });
  }

  const lastSyncedLabel = lastSynced
    ? `Last synced ${lastSynced.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}`
    : "Data updates every 10 min automatically";

  if (compact) {
    return (
      <button
        onClick={handleSync}
        disabled={isPending}
        title={isPending ? "Syncing..." : "Refresh live data"}
        aria-label="Refresh live data"
        className="flex items-center justify-center rounded-md p-2 text-foreground/60 transition-colors hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshIcon spinning={isPending} />
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <RefreshIcon spinning={isPending} />
        {isPending ? "Syncing..." : "Refresh Live Data"}
      </button>
      <p className="text-center text-xs text-foreground/40 sm:text-left">{lastSyncedLabel}</p>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
      aria-hidden="true"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}
