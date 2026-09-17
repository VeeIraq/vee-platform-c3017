import { requireStaff } from "@/lib/auth/dal";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  return (
    <AdminShell staffName={profile!.full_name || "Vee staff"} isSuperAdmin={profile!.internal_role === "super_admin"}>
      {children}
    </AdminShell>
  );
}
