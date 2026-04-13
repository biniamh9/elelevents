import Link from "next/link";
import AdminNotificationBell from "@/components/admin/admin-notification-bell";

export default function AdminWorkspaceHeader({
  adminId,
}: {
  adminId: string;
}) {
  return (
    <div className="admin-topbar">
      <div className="admin-topbar-main">
        <div className="admin-topbar-copy">
          <p className="eyebrow">Admin workspace</p>
          <h2>Business operations</h2>
          <p className="admin-breadcrumbs">
            CRM board, documents, contracts, calendar, pricing, gallery, and vendors.
          </p>
        </div>
      </div>
      <div className="admin-topbar-actions">
        <AdminNotificationBell adminId={adminId} />
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
  );
}
