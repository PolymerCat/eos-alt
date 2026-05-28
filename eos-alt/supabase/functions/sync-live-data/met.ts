/**
 * METMalaysia Weather Warning API fetcher and normalizer.
 *
 * Fetches active weather warnings from data.gov.my and normalizes
 * each record into the shape expected by the weather_alerts table.
 */

import { buildWeatherAlertId } from "./weather-alert-id.ts";

const MET_URL = "https://api.data.gov.my/weather/warning/";

export interface NormalizedWeatherAlert {
  id: string;
  source: string;
  title: string;
  title_bm: string | null;
  description: string | null;
  description_bm: string | null;
  severity: string | null;
  affected_area: string | null;
  state: string | null;
  valid_from: string | null;
  valid_to: string | null;
  raw_payload: Record<string, unknown>;
}

/**
 * Maps METMalaysia heading keywords to our severity scale.
 * This is a best-effort heuristic — adjust as you learn the API's vocabulary.
 */
function inferSeverity(heading: string, title: string): string {
  const text = `${heading} ${title}`.toLowerCase();
  if (text.includes("bahaya") || text.includes("danger")) return "critical";
  if (text.includes("amaran") || text.includes("warning")) return "warning";
  if (text.includes("waspada") || text.includes("watch")) return "watch";
  return "advisory";
}

export async function fetchMetWeatherAlerts(): Promise<NormalizedWeatherAlert[]> {
  const response = await fetch(MET_URL, {
    headers: { "User-Agent": "EOS-Alt/1.0 (sync-live-data edge function)" },
  });

  if (!response.ok) {
    throw new Error(
      `METMalaysia API returned ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  const rawList: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : (data?.data ?? []);

  const alerts: NormalizedWeatherAlert[] = [];

  for (const item of rawList) {
    const warningIssue = (item.warning_issue ?? {}) as Record<string, string>;
    const titleEn = warningIssue.title_en ?? String(item.title ?? "");
    const titleBm = warningIssue.title_bm ?? null;
    const headingEn = String(item.heading_en ?? "");
    const validFrom = String(item.valid_from ?? "");

    const id = await buildWeatherAlertId("METMalaysia", titleEn, validFrom);

    alerts.push({
      id,
      source: "METMalaysia",
      title: titleEn || titleBm || "Weather Warning",
      title_bm: titleBm,
      description: item.text_en ? String(item.text_en) : null,
      description_bm: item.text_bm ? String(item.text_bm) : null,
      severity: inferSeverity(headingEn, titleEn),
      affected_area: null, // METMalaysia doesn't provide a clean field; parse from text if needed
      state: null,
      valid_from: validFrom || null,
      valid_to: item.valid_to ? String(item.valid_to) : null,
      raw_payload: item,
    });
  }

  return alerts;
}
