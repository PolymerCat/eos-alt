import Link from "next/link";

interface AdminForbiddenProps {
  email?: string;
  reason: string;
}

export default function AdminForbidden({ email, reason }: AdminForbiddenProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-3 py-8 sm:px-4 sm:py-10">
      <div className="min-w-0 rounded-lg border border-border bg-panel p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Admin access required</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground [overflow-wrap:anywhere]">You cannot open the admin console.</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/65 [overflow-wrap:anywhere]">
          {email ? `${email} is signed in, but this account is not configured as an admin.` : "No admin account is active."}
        </p>
        <p className="mt-3 rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground/55 [overflow-wrap:anywhere]">
          {reason}
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background"
        >
          Back to overview
        </Link>
      </div>
    </main>
  );
}
