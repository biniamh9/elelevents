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
        <span className="admin-topbar-label">Business health and recent activity</span>
      </div>
      <div className="admin-topbar-actions">
        <AdminNotificationBell adminId={adminId} />
        <Link href="/" className="admin-topbar-primary">
          View Website
        </Link>
      </div>
    </div>
  );
}
