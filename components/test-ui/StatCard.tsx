interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  mode?: "live" | "simulation";
}

export default function StatCard({ label, value, detail, mode }: StatCardProps) {
  // Mode-aware glows and top-border highlights
  const modeShadow = 
    mode === "live" 
      ? "shadow-[0_0_15px_-3px_rgba(59,130,246,0.12)] hover:shadow-[0_0_22px_-2px_rgba(59,130,246,0.16)] dark:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]"
      : mode === "simulation"
      ? "shadow-[0_0_15px_-3px_rgba(16,185,129,0.12)] hover:shadow-[0_0_22px_-2px_rgba(16,185,129,0.16)] dark:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
      : "shadow-sm";

  const modeBorder =
    mode === "live"
      ? "border-t-[3px] border-t-blue-500/80 border-x-border border-b-border"
      : mode === "simulation"
      ? "border-t-[3px] border-t-emerald-500/80 border-x-border border-b-border"
      : "border-border";

  return (
    <div className={`rounded-lg border bg-panel p-4 transition-all text-sm text-foreground/80 ${modeShadow} ${modeBorder}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-foreground/60">{detail}</p>
    </div>
  );
}
