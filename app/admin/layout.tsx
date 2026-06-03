import { redirect } from "next/navigation";
import AdminForbidden from "@/components/admin/AdminForbidden";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminAccess } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();

  if (!access.user) {
    redirect("/login");
  }

  if (!access.isAdmin) {
    return <AdminForbidden email={access.user.email} reason={access.reason} />;
  }

  return <AdminShell email={access.user.email}>{children}</AdminShell>;
}
