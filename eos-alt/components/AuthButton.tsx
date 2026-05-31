import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import NavMenu from "./NavMenu";

export default async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <NavMenu userEmail={user.email || ""} />;
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
