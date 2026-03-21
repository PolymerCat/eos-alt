"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default function MapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
        Flood Map
      </h1>
      <div className="bg-panel border border-border p-6 rounded-xl shadow-sm flex-grow flex items-center justify-center relative overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <Map />
        </div>
      </div>
    </div>
  );
}
