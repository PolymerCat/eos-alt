interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
}

export default function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-foreground/60">{detail}</p>
    </div>
  );
}
