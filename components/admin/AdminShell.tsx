import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";

interface AdminShellProps {
  children: ReactNode;
  email?: string;
}

export default function AdminShell({ children, email }: AdminShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Admin Console</p>
          <h1 className="mt-1 text-xl font-bold text-foreground">Operations</h1>
          {email ? <p className="mt-1 truncate text-xs text-foreground/50">{email}</p> : null}
        </div>
        <AdminNav />
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
