import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdminPage();

  return (
    <div className="container admin-shell">
      <aside className="card admin-sidebar">
        <div className="admin-sidebar-head">
          <p className="eyebrow">Admin CRM</p>
          <h3>Elel Events</h3>
          <p className="muted">{user.email}</p>
        </div>

        <nav className="admin-nav">
          <Link href="/admin/inquiries" className="admin-nav-link">
            Inquiries Dashboard
          </Link>
          <Link href="/admin/contracts" className="admin-nav-link">
            Contracts
          </Link>
          <Link href="/admin/gallery" className="admin-nav-link">
            Gallery
          </Link>
          <Link href="/admin/packages" className="admin-nav-link">
            Packages
          </Link>
        </nav>

        <div className="admin-sidebar-foot">
          <p className="muted">
            Review leads, schedule follow-ups, manage contracts, and keep the
            client flow clean from inquiry to signature.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
