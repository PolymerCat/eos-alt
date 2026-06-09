/**
 * sync-live-data — Supabase Edge Function
 *
 * Fetches live government API data (JKM shelters + METMalaysia weather),
 * upserts it into Supabase tables, and returns a sync summary.
 *
 * Trigger options:
 *   1. pg_cron: every 10 minutes via migration 003_cron_schedule.sql
 *   2. Manual: called from Next.js app/actions/sync.ts on button click
 *
 * Security:
 *   The request must include the header:
 *     Authorization: Bearer <SYNC_SECRET>
 *   Set SYNC_SECRET in Supabase Dashboard → Edge Functions → Secrets.
 *   Also set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as secrets
 *   (Supabase injects these automatically for Edge Functions).
 *
 * Deploy command:
 *   supabase functions deploy sync-live-data
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchJkmShelters } from "./jkm.ts";
import { fetchMetWeatherAlerts } from "./met.ts";

// ── Types ─────────────────────────────────────────────────────

interface SyncSummary {
  sheltersUpserted: number;
  snapshotsInserted: number;
  weatherAlertsUpserted: number;
  errors: string[];
  syncedAt: string;
}

// ── Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Allow CORS for manual browser-originated calls
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // ── Auth check ──────────────────────────────────────────────
  const syncSecret = Deno.env.get("SYNC_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!syncSecret || token !== syncSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Supabase client (service role — bypasses RLS for ingestion) ──
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary: SyncSummary = {
    sheltersUpserted: 0,
    snapshotsInserted: 0,
    weatherAlertsUpserted: 0,
    errors: [],
    syncedAt: new Date().toISOString(),
  };

  // ── 1. Fetch + upsert JKM shelters ──────────────────────────
  try {
    const shelters = await fetchJkmShelters();
    const shelterCapturedAt = new Date().toISOString();

    if (shelters.length > 0) {
      // Upsert identity rows (stable fields only)
      const identityRows = shelters.map((s) => ({
        id: s.id,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        state: s.state,
        district: s.district,
        mukim: s.mukim,
      }));

      const { error: shelterError } = await supabase
        .from("shelters")
        .upsert(identityRows, { onConflict: "id" });

      if (shelterError) {
        summary.errors.push(`shelters upsert: ${shelterError.message}`);
      } else {
        summary.sheltersUpserted = shelters.length;
      }

      // Insert snapshot rows (one per shelter per successful ingestion run).
      const snapshotRows = shelters.map((s) => ({
        shelter_id: s.id,
        disaster_type: s.disaster_type,
        capacity: s.capacity,
        victims: s.victims,
        families: s.families,
        status: "active",
        source: "jkm_api",
        mode: "live",
        captured_at: shelterCapturedAt,
        raw_payload: s.raw_payload,
      }));

      const { error: snapshotError } = await supabase
        .from("shelter_snapshots")
        .insert(snapshotRows);

      if (snapshotError) {
        throw new Error(`shelter_snapshots insert: ${snapshotError.message}`);
      } else {
        summary.snapshotsInserted = snapshotRows.length;
      }

      // Close only older snapshots after the new active set is safely stored.
      // If this update fails, readers still deduplicate by newest captured_at;
      // this is safer than temporarily losing the entire active shelter set.
      const { error: closeError } = await supabase
        .from("shelter_snapshots")
        .update({ status: "closed" })
        .eq("status", "active")
        .lt("captured_at", shelterCapturedAt);

      if (closeError) {
        throw new Error(`failed to close previous shelter snapshots: ${closeError.message}`);
      }
    } else {
      // An empty successful response means there are currently no open
      // shelters. Close any snapshots left active by the previous sync.
      const { error: closeError } = await supabase
        .from("shelter_snapshots")
        .update({ status: "closed" })
        .eq("status", "active");

      if (closeError) {
        throw new Error(`failed to close previous shelter snapshots: ${closeError.message}`);
      }
    }
    // If shelters.length === 0, no active emergencies — that's OK.
  } catch (err) {
    summary.errors.push(`JKM shelter sync failed: ${String(err)}`);
  }

  // ── 2. Fetch + upsert METMalaysia weather alerts ────────────
  try {
    const alerts = await fetchMetWeatherAlerts();

    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from("weather_alerts")
        .upsert(alerts, { onConflict: "id", ignoreDuplicates: true });

      if (alertError) {
        summary.errors.push(`weather_alerts upsert: ${alertError.message}`);
      } else {
        summary.weatherAlertsUpserted = alerts.length;
      }
    }
  } catch (err) {
    summary.errors.push(`METMalaysia fetch failed: ${String(err)}`);
  }

  // ── Return summary ───────────────────────────────────────────
  const status = summary.errors.length > 0 ? 207 : 200; // 207 = partial success
  return new Response(JSON.stringify(summary), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
