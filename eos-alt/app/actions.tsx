"use server";

const BASE = "https://infobencanajkmv2.jkm.gov.my/api/pusat-buka.php?a=0&b=0";

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
        const rawList = out?.points || out?.data || out?.results || (Array.isArray(out) ? out : []);

        const cleanData: PPS[] = rawList.map((item: any) => ({
            id: String(item.id_pusat || item.id),
            name: item.nama_pusat || item.name,
            latti: String(item.latitud || item.latti),
            longi: String(item.longitud || item.longi),
            negeri: item.negeri,
            daerah: item.daerah,
            mukim: item.mukim,
            bencana: item.bencana,
            mangsa: String(item.jumlah_mangsa || item.mangsa),
            keluarga: String(item.jumlah_keluarga || item.keluarga),
            kapasiti: String((item.kapasiti_maksimum || item.kapasiti).toFixed(2)) + "%",
        }));

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

