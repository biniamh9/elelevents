"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

const navItems: NavItem[] = [
  {
    href: "/admin/inquiries",
    label: "Overview",
    description: "Leads, consultations, follow-ups",
    icon: "chart",
  },
  {
    href: "/admin/contracts",
    label: "Contracts",
    description: "Quotes, signatures, payments",
    icon: "doc",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    description: "Event dates and load",
    icon: "calendar",
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    description: "Portfolio images",
    icon: "image",
  },
  {
    href: "/admin/flow",
    label: "Homepage Flow",
    description: "Process text and images",
    icon: "flow",
  },
  {
    href: "/admin/packages",
    label: "Packages",
    description: "Public offers",
    icon: "box",
  },
  {
    href: "/admin/pricing",
    label: "Pricing",
    description: "Quote catalog",
    icon: "tag",
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    description: "Referral partners",
    icon: "users",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Homepage reviews",
    icon: "quote",
  },
  {
    href: "/admin/social",
    label: "Social Links",
    description: "Success screen sharing",
    icon: "share",
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
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3v3" />
          <path d="M17 3v3" />
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16" />
        </svg>
      );
    case "quote":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 9H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v3l3-3v-4a2 2 0 0 0-1-2Z" />
          <path d="M19 9h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v3l3-3v-4a2 2 0 0 0-1-2Z" />
        </svg>
      );
    case "share":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.7 10.7 15.4 6.8" />
          <path d="m8.7 13.3 6.7 3.9" />
        </svg>
      );
    case "flow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="6" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
    case "tag":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m20 13-7 7-9-9V4h7l9 9Z" />
          <circle cx="8.5" cy="8.5" r="1.3" />
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

export default function AdminSidebar({
  userEmail,
}: {
  userEmail: string | null | undefined;
}) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar-shell">
      <div className="admin-sidebar admin-sidebar-panel">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brandmark">EE</div>
          <div>
            <p className="eyebrow">Workspace</p>
            <h3>Elel Events</h3>
          </div>
        </div>

        <div className="admin-workspace-card">
          <div className="admin-workspace-avatar">ED</div>
          <div>
            <span>Active workspace</span>
            <strong>Decor CRM</strong>
            <small>{userEmail || "Admin access"}</small>
          </div>
        </div>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-label">Navigation</p>
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
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-label">Workflow</p>
          <div className="admin-sidebar-note">
            <strong>Simple path</strong>
            <p className="muted">
              Lead, consultation, quote, contract, payment. Anything outside that
              path should stay secondary.
            </p>
          </div>
          <Link href="/request" className="admin-create-link">
            <span>+</span>
            <strong>New request</strong>
          </Link>
        </div>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-support-link">
            View website
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="admin-signout-button">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
