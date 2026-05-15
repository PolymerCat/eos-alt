import TestMap from "@/components/tests/map.test";
import { getAlerts, getWeatherWarnings } from "../actions";
import LiveUpdateBar from "@/components/live-update-bar";
import SidebarTest from "@/components/tests/sidebar.test";

export default async function TestMapPage() {
  const ppsData = await getAlerts();
  const weatherWarnings = await getWeatherWarnings();
  return (
    <div>

      <TestMap ppsData={ppsData} />

    </div>

  );
}
