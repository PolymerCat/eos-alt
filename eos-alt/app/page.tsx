import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Tactical Overview
        </h1>
        <p className="text-foreground/60 font-mono mt-2 text-sm">
          Monitoring regional flood status and shelter availability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Alert Panel - spans 2 columns */}
        <div className="md:col-span-2 bg-panel border gap-2 border-border p-6 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <h2 className="text-xl font-mono font-bold text-accent uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Active Alerts
          </h2>
          <div className="mt-4 p-4 bg-background border border-border/50 rounded flex flex-col items-center justify-center text-center min-h-[200px]">
            <p className="font-mono text-foreground/50 text-sm">Awaiting remote telemetry...</p>
          </div>
        </div>

        {/* User Status / Quick Actions */}
        <div className="bg-panel border border-border p-6 rounded-sm flex flex-col gap-4">
          <h2 className="text-lg font-mono font-bold uppercase text-foreground/90 border-b border-border pb-2">
            Operative Status
          </h2>
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-background border border-border/50 rounded">
            {!user ? (
              <>
                <p className="font-mono text-foreground/50 text-sm mb-4">Authentication Required</p>
                <Link href="/login" className="w-full bg-accent text-accent-foreground font-bold font-mono py-2 px-4 uppercase text-sm hover:brightness-110 transition-all text-center block">
                  Initialize Link
                </Link>
              </>
            ) : (
              <>
                <p className="font-mono text-foreground/90 text-sm mb-1 uppercase">Link Established</p>
                <p className="font-mono text-accent text-xs mb-4 truncate w-full">{user.email}</p>
                <Link href="/map" className="w-full bg-foreground text-background font-bold font-mono py-2 px-4 uppercase text-sm hover:brightness-110 transition-all text-center block border border-foreground">
                  View Tactical Map
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
