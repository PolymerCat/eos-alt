import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { logout } from "@/app/login/actions";

export default async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right">
          <Link href="/profile" className="text-xs font-mono text-foreground/50 hover:text-accent transition-colors">OPERATIVE</Link>
          <span className="text-sm font-mono text-accent truncate max-w-[150px]">{user.email}</span>
        </div>
        <form action={logout}>
          <button className="px-3 py-1 font-mono text-xs uppercase border border-border text-foreground/70 hover:text-accent hover:border-accent transition-colors">
            End Link
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="px-4 py-2 bg-accent text-accent-foreground font-mono text-xs uppercase font-bold hover:brightness-110 transition-colors"
      >
        Initialize Link
      </Link>
    </div>
  );
}
