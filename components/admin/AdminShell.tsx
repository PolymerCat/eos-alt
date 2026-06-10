import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";

interface AdminShellProps {
  children: ReactNode;
  email?: string;
}

export default function AdminShell({ children, email }: AdminShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
        <div className="mb-3 lg:mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Admin Console</p>
          <div className="mt-1 flex min-w-0 items-baseline justify-between gap-3 lg:block">
            <h1 className="shrink-0 text-xl font-bold text-foreground">Operations</h1>
            {email ? <p className="min-w-0 truncate text-xs text-foreground/50 lg:mt-1">{email}</p> : null}
          </div>
        </div>
        <AdminNav />
      </aside>
      <main className="min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
