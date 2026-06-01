import TestMap from "@/components/tests/map.test";
import { getEmergencyData } from "@/data/providers/emergency-data-provider";
import { getWeatherForecasts } from "@/app/actions";
import Link from "next/link";
import { Suspense } from "react";

export default async function TestMapPage(props: { searchParams: Promise<{ mode?: string }> }) {
  const searchParams = await props.searchParams;
  const mode = searchParams.mode === "simulation" ? "simulation" : "live";
  
  const data = await getEmergencyData({ mode });
  const ppsData = data.shelters;
  const weatherData = await getWeatherForecasts();

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 flex gap-1">
        <Link 
          href="?mode=live" 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'live' ? 'bg-blue-500 text-white' : 'text-white/70 hover:text-white'}`}
        >
          Live Data
        </Link>
        <Link 
          href="?mode=simulation" 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'simulation' ? 'bg-emerald-500 text-white' : 'text-white/70 hover:text-white'}`}
        >
          Simulation Data
        </Link>
      </div>
      <TestMap ppsData={ppsData} weatherData={weatherData} />
    </div>
  );
}
