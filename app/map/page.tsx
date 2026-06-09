import Map from "@/components/map";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";

export default async function MapPage() {
  // Use the shared provider so this map cannot drift from the dashboard,
  // test map, offline hub, and reporting shelter semantics.
  const data = await getEmergencyData({ mode: "live" });
  const activeShelters = data.shelters.filter(
    (shelter) => shelter.operationalStatus === "active" || shelter.status !== "offline"
  );

  return <Map ppsData={activeShelters} />;
}
