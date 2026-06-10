interface AdminStatusPillProps {
  label: string;
  tone?: "green" | "gray" | "amber" | "red" | "blue";
}

const toneClassName: Record<NonNullable<AdminStatusPillProps["tone"]>, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  gray: "border-slate-200 bg-slate-50 text-slate-600",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function AdminStatusPill({ label, tone = "gray" }: AdminStatusPillProps) {
  return (
    <span className={`inline-flex w-fit max-w-full shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold [overflow-wrap:anywhere] ${toneClassName[tone]}`}>
      {label}
    </span>
  );
}
