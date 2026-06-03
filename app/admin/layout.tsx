import { redirect } from "next/navigation";
import AdminForbidden from "@/components/admin/AdminForbidden";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminAccess } from "@/lib/admin/auth";
import { getAdmin } from "../layout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  const admin = await getAdmin();

  if (!access.user) {
    redirect("/login");
  }

  if (!admin) {
    return <AdminForbidden email={access.user.email} reason={access.reason} />;
  }

  return <AdminShell email={access.user.email}>{children}</AdminShell>;
}
