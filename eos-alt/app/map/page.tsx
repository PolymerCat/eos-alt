import dynamic from "next/dynamic";
import { getAlerts, PPS } from "@/app/actions";

const Map = dynamic<{ alerts: PPS[] }>(() => import("@/components/map"), {
  // ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default async function MapPage() {
  const alerts = await getAlerts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
        Flood Map
      </h1>
      <div className="bg-panel border border-border p-6 rounded-xl shadow-sm flex-grow flex items-center justify-center relative overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <Map alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
