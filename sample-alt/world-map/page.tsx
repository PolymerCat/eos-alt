import Map from "../components/Map";
import LogoutButton from "../components/LogoutButton";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      {/* <LogoutButton /> */}
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Flood Lookout</h1>
          <p className="text-slate-600">Real-time incident "Look Links" system.</p>
        </header>

        {/* The Map */}
        <section>
          <Map />
        </section>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Status</p>
          <p className="text-slate-600 italic">Map initialized with MapLibre GL JS.</p>
        </div>
      </div>
    </main>
  );
}