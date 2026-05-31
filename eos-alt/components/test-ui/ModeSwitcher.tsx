import Link from "next/link";
import type { DataMode } from "@/types/emergency";

interface ModeSwitcherProps {
  mode: DataMode;
  pathname: string;
}

export default function ModeSwitcher({ mode, pathname }: ModeSwitcherProps) {
  const isSimulation = mode === "simulation";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-panel p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {isSimulation ? "Simulation Mode Active" : "Live Mode Active"}
        </p>
        <p className="text-xs text-foreground/60">
          {isSimulation
            ? "Using scenario data shaped like the real project entities."
            : "Using live API and current Supabase data where available."}
        </p>
      </div>
      <div className="flex w-full sm:w-auto overflow-hidden rounded-md border border-border text-sm font-medium">
        <Link
          href={`${pathname}?mode=simulation`}
          className={`flex-1 sm:flex-none text-center px-4 py-2 ${isSimulation ? "bg-accent text-accent-foreground" : "bg-background text-foreground/70"}`}
        >
          Simulation
        </Link>
        <Link
          href={`${pathname}?mode=live`}
          className={`flex-1 sm:flex-none text-center px-4 py-2 ${!isSimulation ? "bg-accent text-accent-foreground" : "bg-background text-foreground/70"}`}
        >
          Live
        </Link>
      </div>
    </div>
  );
}
