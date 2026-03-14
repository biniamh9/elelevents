import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import AdminSidebar from "@/components/admin/admin-sidebar";

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
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">CRM Workspace</p>
            <h2>Business operations</h2>
          </div>
          <Link href="/admin/inquiries" className="btn secondary">
            Open dashboard
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
