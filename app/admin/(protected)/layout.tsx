import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminNotificationBell from "@/components/admin/admin-notification-bell";

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
          <div className="admin-topbar-main">
            <div className="admin-topbar-copy">
              <p className="eyebrow">Admin workspace</p>
              <h2>Business operations</h2>
              <p className="admin-breadcrumbs">CRM board • Contracts • Pricing • Gallery • Vendors</p>
            </div>
            <div className="admin-topbar-tabs" aria-label="Workspace sections">
              <Link href="/admin/inquiries" className="admin-topbar-tab">
                Overview
              </Link>
              <Link href="/admin/contracts" className="admin-topbar-tab">
                Contracts
              </Link>
              <Link href="/admin/packages" className="admin-topbar-tab">
                Packages
              </Link>
              <Link href="/admin/pricing" className="admin-topbar-tab">
                Pricing
              </Link>
              <Link href="/admin/vendors" className="admin-topbar-tab">
                Vendors
              </Link>
              <Link href="/admin/testimonials" className="admin-topbar-tab">
                Testimonials
              </Link>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <AdminNotificationBell adminId={user.id} />
            <Link href="/admin/gallery" className="admin-topbar-pill">
              Gallery
            </Link>
            <Link href="/request" className="admin-topbar-pill">
              Public form
            </Link>
            <Link href="/request" className="btn">
              Create inquiry
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
