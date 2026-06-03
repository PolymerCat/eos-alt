import type { AlertSeverity } from "@/types/emergency";

const severityStyles: Record<AlertSeverity, string> = {
  advisory: "border-slate-300 bg-slate-50 text-slate-700",
  watch: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

interface StatusBadgeProps {
  label: string;
  severity?: AlertSeverity;
}

export default function StatusBadge({ label, severity = "advisory" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyles[severity]}`}
    >
      {label}
    </span>
  );
}
