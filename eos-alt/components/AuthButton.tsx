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
          <Link href="/profile" className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors">Profile</Link>
          <span className="text-sm text-foreground/90 truncate max-w-[150px]">{user.email}</span>
        </div>
        <form action={logout}>
          <button className="px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md text-foreground/80 hover:bg-foreground/5 transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="px-4 py-2 bg-accent text-accent-foreground font-medium rounded-md text-sm hover:bg-accent/90 transition-colors"
      >
        Sign In
      </Link>
    </div>
  );
}
