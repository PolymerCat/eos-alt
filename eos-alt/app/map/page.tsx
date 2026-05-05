import Map from "@/components/map";
import { getAlerts } from "../actions";

export default async function MapPage() {
  const ppsData = await getAlerts();

  return (
    <Map ppsData={ppsData} />
  );
}