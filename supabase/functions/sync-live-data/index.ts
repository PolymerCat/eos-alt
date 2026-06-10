/**
 * Synchronizes public JKM shelter and METMalaysia weather data.
 *
 * Besides updating current-state tables, successful syncs create immutable
 * emergency timeline events. Failed upstream requests never generate shelter
 * closures because a failed request is not evidence of a real-world change.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchJkmShelters } from "./jkm.ts";
import { fetchMetWeatherAlerts } from "./met.ts";

interface SyncSummary {
  sheltersUpserted: number;
  snapshotsInserted: number;
  weatherAlertsUpserted: number;
  errors: string[];
  syncedAt: string;
}

type PreviousShelterSnapshot = {
  shelter_id: string;
  disaster_type: string | null;
  shelters: {
    name: string;
    state: string;
    district: string;
  } | Array<{
    name: string;
    state: string;
    district: string;
  }> | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const syncSecret = Deno.env.get("SYNC_SECRET");
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

  if (!syncSecret || token !== syncSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const shelterRunId = crypto.randomUUID();
  await supabase.from("emergency_sync_runs").insert({
    id: shelterRunId,
    source: "jkm_api",
    status: "running",
    started_at: summary.syncedAt,
  });

  try {
    const shelters = await fetchJkmShelters();
    const shelterCapturedAt = new Date().toISOString();
    const { data: previousRows, error: previousError } = await supabase
      .from("shelter_snapshots")
      .select(`
        shelter_id,
        disaster_type,
        shelters (name, state, district)
      `)
      .eq("status", "active")
      .order("captured_at", { ascending: false })
      .limit(2000);

    if (previousError) {
      throw new Error(`failed to load previous active shelters: ${previousError.message}`);
    }

    const previousShelters = new Map<string, PreviousShelterSnapshot>();
    for (const row of (previousRows ?? []) as PreviousShelterSnapshot[]) {
      if (!previousShelters.has(row.shelter_id)) previousShelters.set(row.shelter_id, row);
    }
    const currentShelterIds = new Set(shelters.map((shelter) => shelter.id));

    if (shelters.length > 0) {
      const identityRows = shelters.map((shelter) => ({
        id: shelter.id,
        name: shelter.name,
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        state: shelter.state,
        district: shelter.district,
        mukim: shelter.mukim,
      }));

      const { error: shelterError } = await supabase
        .from("shelters")
        .upsert(identityRows, { onConflict: "id" });
      if (shelterError) throw new Error(`shelters upsert: ${shelterError.message}`);
      summary.sheltersUpserted = shelters.length;

      const snapshotRows = shelters.map((shelter) => ({
        shelter_id: shelter.id,
        disaster_type: shelter.disaster_type,
        capacity: shelter.capacity,
        victims: shelter.victims,
        families: shelter.families,
        status: "active",
        source: "jkm_api",
        mode: "live",
        captured_at: shelterCapturedAt,
        raw_payload: shelter.raw_payload,
      }));

      const { error: snapshotError } = await supabase
        .from("shelter_snapshots")
        .insert(snapshotRows);
      if (snapshotError) throw new Error(`shelter_snapshots insert: ${snapshotError.message}`);
      summary.snapshotsInserted = snapshotRows.length;

      const { error: closeError } = await supabase
        .from("shelter_snapshots")
        .update({ status: "closed" })
        .eq("status", "active")
        .lt("captured_at", shelterCapturedAt);
      if (closeError) throw new Error(`failed to close previous shelter snapshots: ${closeError.message}`);
    } else {
      const { error: closeError } = await supabase
        .from("shelter_snapshots")
        .update({ status: "closed" })
        .eq("status", "active");
      if (closeError) throw new Error(`failed to close previous shelter snapshots: ${closeError.message}`);
    }

    const timelineEvents = [
      ...shelters
        .filter((shelter) => !previousShelters.has(shelter.id))
        .map((shelter) => ({
          event_key: `${shelterRunId}:shelter_opened:${shelter.id}`,
          event_type: "shelter_opened",
          occurred_at: shelterCapturedAt,
          shelter_id: shelter.id,
          disaster_type: shelter.disaster_type,
          state: shelter.state,
          district: shelter.district,
          title: `${shelter.name} opened`,
          description: shelter.disaster_type
            ? `Temporary shelter opened for ${shelter.disaster_type}.`
            : "Temporary shelter opened.",
          metadata: {
            capacity: shelter.capacity,
            victims: shelter.victims,
            families: shelter.families,
          },
          source: "jkm_api",
          sync_run_id: shelterRunId,
        })),
      ...Array.from(previousShelters.values())
        .filter((previous) => !currentShelterIds.has(previous.shelter_id))
        .map((previous) => {
          const shelter = firstRelation(previous.shelters);
          return {
            event_key: `${shelterRunId}:shelter_closed:${previous.shelter_id}`,
            event_type: "shelter_closed",
            occurred_at: shelterCapturedAt,
            shelter_id: previous.shelter_id,
            disaster_type: previous.disaster_type,
            state: shelter?.state ?? null,
            district: shelter?.district ?? null,
            title: `${shelter?.name ?? "Shelter"} closed`,
            description: "Shelter is no longer present in the latest successful JKM open-shelter feed.",
            metadata: {},
            source: "jkm_api",
            sync_run_id: shelterRunId,
          };
        }),
    ];

    if (timelineEvents.length > 0) {
      const { error: timelineError } = await supabase
        .from("emergency_timeline_events")
        .upsert(timelineEvents, { onConflict: "event_key", ignoreDuplicates: true });
      if (timelineError) throw new Error(`timeline event insert: ${timelineError.message}`);
    }

    await supabase
      .from("emergency_sync_runs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        records_received: shelters.length,
      })
      .eq("id", shelterRunId);
  } catch (error) {
    const message = String(error);
    summary.errors.push(`JKM shelter sync failed: ${message}`);
    await supabase
      .from("emergency_sync_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error_message: message })
      .eq("id", shelterRunId);
  }

  const weatherRunId = crypto.randomUUID();
  await supabase.from("emergency_sync_runs").insert({
    id: weatherRunId,
    source: "metmalaysia_api",
    status: "running",
    started_at: summary.syncedAt,
  });

  try {
    const alerts = await fetchMetWeatherAlerts();
    const alertIds = alerts.map((alert) => alert.id);
    const existingIds = new Set<string>();

    if (alertIds.length > 0) {
      const { data: existingAlerts, error: existingError } = await supabase
        .from("weather_alerts")
        .select("id")
        .in("id", alertIds);
      if (existingError) throw new Error(`failed to load existing weather alerts: ${existingError.message}`);
      for (const alert of existingAlerts ?? []) existingIds.add(alert.id);
    }

    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from("weather_alerts")
        .upsert(alerts, { onConflict: "id", ignoreDuplicates: true });
      if (alertError) throw new Error(`weather_alerts upsert: ${alertError.message}`);
      summary.weatherAlertsUpserted = alerts.length;

      const issuedEvents = alerts
        .filter((alert) => !existingIds.has(alert.id))
        .map((alert) => ({
          event_key: `met:weather_alert_issued:${alert.id}`,
          event_type: "weather_alert_issued",
          occurred_at: alert.valid_from ?? summary.syncedAt,
          weather_alert_id: alert.id,
          state: alert.state,
          title: alert.title,
          description: alert.description,
          metadata: { severity: alert.severity, valid_to: alert.valid_to },
          source: "metmalaysia_api",
          sync_run_id: weatherRunId,
        }));

      if (issuedEvents.length > 0) {
        const { error: issuedError } = await supabase
          .from("emergency_timeline_events")
          .upsert(issuedEvents, { onConflict: "event_key", ignoreDuplicates: true });
        if (issuedError) throw new Error(`weather issued event insert: ${issuedError.message}`);
      }
    }

    const now = new Date().toISOString();
    const { data: expiredAlerts, error: expiredError } = await supabase
      .from("weather_alerts")
      .select("id, title, description, state, severity, valid_to")
      .not("valid_to", "is", null)
      .lte("valid_to", now)
      .limit(500);
    if (expiredError) throw new Error(`failed to load expired weather alerts: ${expiredError.message}`);

    const expiredEvents = (expiredAlerts ?? []).map((alert) => ({
      event_key: `met:weather_alert_expired:${alert.id}`,
      event_type: "weather_alert_expired",
      occurred_at: alert.valid_to,
      weather_alert_id: alert.id,
      state: alert.state,
      title: `${alert.title} expired`,
      description: alert.description,
      metadata: { severity: alert.severity },
      source: "metmalaysia_api",
      sync_run_id: weatherRunId,
    }));

    if (expiredEvents.length > 0) {
      const { error: expiredEventError } = await supabase
        .from("emergency_timeline_events")
        .upsert(expiredEvents, { onConflict: "event_key", ignoreDuplicates: true });
      if (expiredEventError) throw new Error(`weather expired event insert: ${expiredEventError.message}`);
    }

    await supabase
      .from("emergency_sync_runs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        records_received: alerts.length,
      })
      .eq("id", weatherRunId);
  } catch (error) {
    const message = String(error);
    summary.errors.push(`METMalaysia sync failed: ${message}`);
    await supabase
      .from("emergency_sync_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error_message: message })
      .eq("id", weatherRunId);
  }

  return new Response(JSON.stringify(summary), {
    status: summary.errors.length > 0 ? 207 : 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
