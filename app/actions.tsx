"use server";

const BASE = "https://infobencanajkmv2.jkm.gov.my/api/pusat-buka.php?a=0&b=0";
const DEFAULT_MET_FORECAST_URL = "https://www.met.gov.my/json/cuaca_semasa/data.json";
const MET_FORECAST_URL = process.env.MET_FORECAST_URL ?? DEFAULT_MET_FORECAST_URL;

const MET_FORECAST_STABLE = "https://api.data.gov.my/weather/forecast/";


export interface WeatherWarning {
    warning_issue: {
        title_bm: string;
        title_en: string;
    };
    valid_from: string;
    valid_to: string;
    text_bm: string;
    text_en: string;
    heading_bm: string;
    heading_en: string;
}

export interface PPS {
    id: string;
    name: string;
    latti: string;
    longi: string;
    negeri: string;
    daerah: string;
    mukim: string;
    bencana: string;
    mangsa: string;
    keluarga: string;
    kapasiti: string;
    status: string;
}

export interface WeatherForecast {
    code: string;
    station: string;
    timestamp: string;
    temp: string;
    state: string;
    rainfall: Record<string, string>;
    icon: string;
}

interface JkmPpsRaw {
    id_pusat?: unknown;
    id?: unknown;
    nama_pusat?: unknown;
    name?: unknown;
    latitud?: unknown;
    latti?: unknown;
    longitud?: unknown;
    longi?: unknown;
    negeri?: unknown;
    daerah?: unknown;
    mukim?: unknown;
    bencana?: unknown;
    jumlah_mangsa?: unknown;
    mangsa?: unknown;
    jumlah_keluarga?: unknown;
    keluarga?: unknown;
    kapasiti_maksimum?: unknown;
    kapasiti?: unknown;
    status?: unknown;
}

function asText(value: unknown, fallback = ""): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function asPercent(value: unknown): string {
    const numericValue = typeof value === "number" ? value : Number.parseFloat(asText(value));
    return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : "0.00%";
}

function getArrayPayload(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    const payload = value as Record<string, unknown>;
    const candidate = payload.points ?? payload.data ?? payload.results ?? payload.forecast;
    return Array.isArray(candidate) ? candidate : [];
}

function asRainfallTimeline(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([time, icon]) => [
            time,
            asText(icon),
        ])
    );
}

function getMetForecastUrl(): string {
    try {
        const url = new URL(MET_FORECAST_URL);

        // MET Malaysia appends nocache timestamps in the browser. The data path is stable.
        url.searchParams.delete("nocache");
        return url.toString();
    } catch {
        return DEFAULT_MET_FORECAST_URL;
    }
}

export async function getAlerts(): Promise<PPS[]> {
    try {
        const response = await fetch(BASE, {
            // JKM API might require revalidation tags for fresh data
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) throw new Error("Failed to fetch JKM data");

        const out = await response.json();

        // The JKM API returns data inside a 'points' key.
        const rawList = getArrayPayload(out);

        const cleanData: PPS[] = rawList.map((rawItem) => {
            const item = rawItem as JkmPpsRaw;

            return {
                id: asText(item.id_pusat ?? item.id),
                name: asText(item.nama_pusat ?? item.name),
                latti: asText(item.latitud ?? item.latti),
                longi: asText(item.longitud ?? item.longi),
                negeri: asText(item.negeri),
                daerah: asText(item.daerah),
                mukim: asText(item.mukim),
                bencana: asText(item.bencana),
                mangsa: asText(item.jumlah_mangsa ?? item.mangsa),
                keluarga: asText(item.jumlah_keluarga ?? item.keluarga),
                kapasiti: asPercent(item.kapasiti_maksimum ?? item.kapasiti),
                status: asText(item.status),
            };
        });

        return cleanData;
    } catch (error) {
        console.error("JKM Fetch Error:", error);
        return [];
    }
}

export async function getWeatherWarnings(): Promise<WeatherWarning[]> {
    try {
        const response = await fetch("https://api.data.gov.my/weather/warning/", {
            next: { revalidate: 300 }
        });

        if (!response.ok) throw new Error("Failed to fetch weather warnings");

        const data = await response.json();
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
        console.error("Weather Warning Fetch Error:", error);
        return [];
    }
}

export async function getWeatherForecasts(): Promise<WeatherForecast[]> {
    try {
        const response = await fetch(getMetForecastUrl(), {
            next: { revalidate: 600 }
        });

        if (!response.ok) throw new Error("Failed to fetch MET Malaysia forecast data");

        const data = await response.json();
        const rawList = getArrayPayload(data);

        return rawList.map((rawItem) => {
            const item = rawItem as Partial<Record<keyof WeatherForecast, unknown>>;

            return {
                code: asText(item.code),
                station: asText(item.station),
                timestamp: asText(item.timestamp),
                temp: asText(item.temp),
                state: asText(item.state),
                rainfall: asRainfallTimeline(item.rainfall),
                icon: asText(item.icon),
            };
        });
    } catch (error) {
        console.error("Weather Forecast Fetch Error:", error);
        return [];
    }
}

