import { requireAdminPage } from "@/lib/auth/admin";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminWorkspaceHeader from "@/components/admin/admin-workspace-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdminPage();

  return (
    <div className="container admin-shell">
      <AdminSidebar userEmail={user.email} />

      <div className="admin-main">
        <AdminWorkspaceHeader adminId={user.id} />
        {children}
      </div>
    </div>
  );
}
