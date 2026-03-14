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
          <div className="admin-topbar-copy">
            <p className="eyebrow">Dashboard</p>
            <h2>Business operations</h2>
            <p className="admin-breadcrumbs">Admin CRM • Daily workspace</p>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/admin/packages" className="admin-topbar-pill">
              Packages
            </Link>
            <Link href="/admin/gallery" className="admin-topbar-pill">
              Gallery
            </Link>
            <Link href="/request" className="btn">
              Open public form
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
