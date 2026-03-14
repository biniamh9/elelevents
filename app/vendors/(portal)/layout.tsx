import Link from "next/link";
import { requireVendorPage } from "@/lib/auth/vendor";

export default async function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendor } = await requireVendorPage();

  return (
    <div className="container admin-shell">
      <aside className="card admin-sidebar">
        <div className="admin-sidebar-head">
          <p className="eyebrow">Vendor Portal</p>
          <h3>{vendor.business_name}</h3>
          <p className="muted">Referral partner</p>
        </div>

        <nav className="admin-nav">
          <Link href="/vendors/dashboard" className="admin-nav-link">
            <div className="admin-nav-icon">•</div>
            <div>
              <strong>Referrals</strong>
              <span>Review and respond to new leads</span>
            </div>
          </Link>
        </nav>

        <form action="/auth/signout" method="post">
          <button type="submit" className="btn">
            Sign Out
          </button>
        </form>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
}
