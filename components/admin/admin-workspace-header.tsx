import Link from "next/link";

export default function AdminWorkspaceHeader({
  adminId: _adminId,
}: {
  adminId: string;
}) {
  return (
    <div className="admin-topbar">
      <div className="admin-topbar-main" />
      <div className="admin-topbar-actions">
        <Link href="/" className="admin-topbar-primary">
          View Website
        </Link>
      </div>
    </div>
  );
}
