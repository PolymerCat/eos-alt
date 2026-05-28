/**
 * JKM Open Shelter API fetcher and normalizer.
 *
 * Fetches live PPS (Pusat Pemindahan Sementara) data from JKM
 * and normalizes each record into the shape expected by Supabase.
 */

const JKM_URL =
  "https://infobencanajkmv2.jkm.gov.my/api/pusat-buka.php?a=0&b=0";

export interface NormalizedShelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  mukim: string | null;
  disaster_type: string | null;
  // snapshot fields
  capacity: string;
  victims: string;
  families: string;
  raw_payload: Record<string, unknown>;
}

export async function fetchJkmShelters(): Promise<NormalizedShelter[]> {
  const response = await fetch(JKM_URL, {
    headers: { "User-Agent": "EOS-Alt/1.0 (sync-live-data edge function)" },
  });

  if (!response.ok) {
    throw new Error(
      `JKM API returned ${response.status}: ${response.statusText}`,
    );
  }

  const out = await response.json();

  // JKM API wraps results in a 'points' key (or falls back to array)
  const rawList: Record<string, unknown>[] =
    out?.points ?? out?.data ?? out?.results ?? (Array.isArray(out) ? out : []);

  return rawList.map((item) => {
    const capacityRaw = item.kapasiti_maksimum ?? item.kapasiti ?? 0;
    const capacityNum =
      typeof capacityRaw === "number"
        ? capacityRaw
        : parseFloat(String(capacityRaw)) || 0;

    return {
      id: String(item.id_pusat ?? item.id),
      name: String(item.nama_pusat ?? item.name ?? "Unknown"),
      latitude: parseFloat(String(item.latitud ?? item.latti)) || 0,
      longitude: parseFloat(String(item.longitud ?? item.longi)) || 0,
      state: String(item.negeri ?? ""),
      district: String(item.daerah ?? ""),
      mukim: item.mukim ? String(item.mukim) : null,
      disaster_type: item.bencana ? String(item.bencana) : null,
      // snapshot fields
      capacity: `${capacityNum.toFixed(2)}%`,
      victims: String(item.jumlah_mangsa ?? item.mangsa ?? "0"),
      families: String(item.jumlah_keluarga ?? item.keluarga ?? "0"),
      raw_payload: item,
    };
  });
}
