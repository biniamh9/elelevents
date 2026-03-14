"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
};

const navItems: NavItem[] = [
  {
    href: "/admin/inquiries",
    label: "Dashboard",
    shortLabel: "Dashboard",
    description: "Leads, consultations, follow-ups",
    icon: "chart",
  },
  {
    href: "/admin/contracts",
    label: "Contracts",
    shortLabel: "Contracts",
    description: "Quotes, signature flow, payments",
    icon: "doc",
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    shortLabel: "Gallery",
    description: "Portfolio images",
    icon: "image",
  },
  {
    href: "/admin/packages",
    label: "Packages",
    shortLabel: "Packages",
    description: "Public offers",
    icon: "box",
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    shortLabel: "Vendors",
    description: "Referral partners",
    icon: "users",
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "chart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18h16" />
          <path d="M7 16V9" />
          <path d="M12 16V6" />
          <path d="M17 16v-4" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3h6l4 4v14H8z" />
          <path d="M14 3v4h4" />
          <path d="M10 12h6" />
          <path d="M10 16h6" />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="m8 14 3-3 3 3 2-2 4 4" />
          <circle cx="9" cy="9" r="1.4" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="8" r="3" />
          <path d="M20 19v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 5.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14v10H5z" />
          <path d="M9 7V5h6v2" />
        </svg>
      );
  }
}

export default function AdminSidebar({ userEmail }: { userEmail: string | null | undefined }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar-shell">
      <div className="card admin-sidebar admin-sidebar-rail">
        <div className="admin-rail-brand">EE</div>
        <div className="admin-rail-links">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-rail-link${active ? " is-active" : ""}`}
                aria-label={item.label}
                title={item.label}
              >
                <SidebarIcon icon={item.icon} />
              </Link>
            );
          })}
        </div>

        <form action="/auth/signout" method="post" className="admin-rail-signout">
          <button type="submit" className="admin-rail-link" aria-label="Sign out" title="Sign out">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 7H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3" />
              <path d="m14 8 4 4-4 4" />
              <path d="M18 12H9" />
            </svg>
          </button>
        </form>
      </div>

      <div className="card admin-sidebar admin-sidebar-panel">
        <div className="admin-sidebar-head">
          <p className="eyebrow">Admin CRM</p>
          <h3>Elel Events</h3>
          <p className="muted">{userEmail || "Admin access"}</p>
        </div>

        <Link href="/request" className="admin-create-link">
          <span>+</span>
          <strong>Create New</strong>
        </Link>

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
                  <div className="admin-nav-icon">
                    <SidebarIcon icon={item.icon} />
                  </div>
                  <div>
                    <strong>{item.shortLabel}</strong>
                    <span>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-label">Notes</p>
          <div className="admin-sidebar-note">
            <strong>Keep the workflow simple</strong>
            <p className="muted">
              Start with new leads, schedule consultations, send quotes, then move
              approved clients into contracts.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
