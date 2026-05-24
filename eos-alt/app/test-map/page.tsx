import TestMap from "@/components/tests/map.test";
import { getAlerts } from "../actions";

export default async function TestMapPage() {
  const ppsData = await getAlerts();

  return (
    <div>
      <TestMap ppsData={ppsData} />
    </div>

  );
}
