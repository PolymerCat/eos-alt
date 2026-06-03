import Map from "@/components/map";
import { createClient } from "@/utils/supabase/server";

export default async function MapPage() {
  const supabase = await createClient();

  // Read the latest shelter snapshot per shelter from Supabase DB.
  // Falls back to an empty array if no sync has happened yet —
  // in that case the user can click "Refresh Live Data" in the sidebar.
  const { data: snapshotRows } = await supabase
    .from("shelter_snapshots")
    .select(`
      shelter_id,
      capacity,
      victims,
      families,
      shelters (
        id, name, latitude, longitude,
        state, district, mukim, disaster_type
      )
    `)
    .eq("status", "active")
    .order("captured_at", { ascending: false })
    .limit(300);

  // Deduplicate: keep only the latest snapshot per shelter
  const seenIds = new Set<string>();
  const ppsData = (snapshotRows ?? [])
    .filter((row) => {
      if (!row.shelter_id || seenIds.has(row.shelter_id)) return false;
      seenIds.add(row.shelter_id);
      return true;
    })
    .map((row) => {
      const s = Array.isArray(row.shelters) ? row.shelters[0] : row.shelters;
      if (!s) return null;
      return {
        id: s.id,
        name: s.name,
        latti: String(s.latitude),
        longi: String(s.longitude),
        negeri: s.state,
        daerah: s.district,
        mukim: s.mukim ?? "",
        bencana: s.disaster_type ?? "",
        mangsa: row.victims ?? "0",
        keluarga: row.families ?? "0",
        kapasiti: row.capacity ?? "0.00%",
      };
    })
    .filter(Boolean);

  return <Map ppsData={ppsData as any} />;
}