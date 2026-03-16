import Map from "@/components/map";

export default function MapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground mb-4">
        Tactical Map
      </h1>
      <div className="bg-panel border border-border p-6 rounded-sm flex-grow flex items-center justify-center relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent"></div>

        <div className="font-mono text-foreground/50 uppercase tracing-widest w-full h-full flex flex-col">
          <Map />
        </div>
      </div>
    </div>
  );
}
