import TestMap from "@/components/tests/map.test";
import { getAlerts } from "../actions";

export default async function TestMapPage() {
  const ppsData = await getAlerts();

  return (
    <TestMap ppsData={ppsData} />
  );
}