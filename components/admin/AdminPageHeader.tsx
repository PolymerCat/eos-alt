import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-4 border-b border-border pb-5 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Admin</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground [overflow-wrap:anywhere]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/60">{description}</p>
      </div>
      {actions ? <div className="w-full shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{actions}</div> : null}
    </div>
  );
}
