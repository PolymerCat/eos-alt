"use server";

/**
 * sync.ts — Next.js Server Action
 *
 * Thin proxy that calls the `sync-live-data` Supabase Edge Function
 * on behalf of the client. The SYNC_SECRET and SUPABASE_URL are
 * environment variables that NEVER leave the server.
 *
 * Required .env.local keys:
 *   SUPABASE_URL            (or NEXT_PUBLIC_SUPABASE_URL)
 *   SYNC_SECRET             a long random string matching the Edge Function secret
 *
 * The client Refresh button calls this action directly.
 * This action does NOT run on page load.
 */

export interface SyncResult {
  sheltersUpserted: number;
  snapshotsInserted: number;
  weatherAlertsUpserted: number;
  errors: string[];
  syncedAt: string;
}

export async function triggerLiveDataSync(): Promise<SyncResult> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const syncSecret = process.env.SYNC_SECRET;

  if (!supabaseUrl || !syncSecret) {
    throw new Error(
      "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SYNC_SECRET",
    );
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-live-data`;

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${syncSecret}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok && response.status !== 207) {
    const text = await response.text();
    throw new Error(
      `Edge Function error (${response.status}): ${text}`,
    );
  }

  const result: SyncResult = await response.json();
  return result;
}
