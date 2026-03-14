"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin/inquiries",
    label: "Inquiries",
    description: "Leads, consultations, follow-ups",
  },
  {
    href: "/admin/contracts",
    label: "Contracts",
    description: "Quotes, signature flow, payments",
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    description: "Upload and organize portfolio images",
  },
  {
    href: "/admin/packages",
    label: "Packages",
    description: "Edit, hide, or remove public offers",
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({ userEmail }: { userEmail: string | null | undefined }) {
  const pathname = usePathname();

  return (
    <aside className="card admin-sidebar">
      <div className="admin-sidebar-head">
        <p className="eyebrow">Admin CRM</p>
        <h3>Elel Events</h3>
        <p className="muted">{userEmail || "Admin access"}</p>
      </div>

      <div className="admin-sidebar-section">
        <p className="admin-sidebar-label">Workspace</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? " is-active" : ""}`}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-section">
        <p className="admin-sidebar-label">Notes</p>
        <div className="admin-sidebar-note">
          <strong>What you can already do here</strong>
          <p className="muted">
            Track requests, update consultations, send quotes, manage contracts,
            and keep the public gallery and packages current.
          </p>
        </div>
      </div>

      <div className="admin-sidebar-foot">
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
