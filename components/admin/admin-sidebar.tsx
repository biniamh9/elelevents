import Link from "next/link";
import { canAccessModule, type AdminModule } from "@/lib/admin-access";

type NavChild = {
  href: string;
  label: string;
};

type NavSection = {
  id: string;
  label: string;
  description: string;
  module: AdminModule;
  href?: string;
  defaultOpen?: boolean;
  children?: NavChild[];
};

const navSections: NavSection[] = [
  {
    id: "homepage",
    label: "Homepage now",
    description: "Review for Flow",
    module: "content",
    href: "/admin/flow",
  },
  {
    id: "overview",
    label: "Overview",
    description: "Business operations",
    module: "overview",
    defaultOpen: true,
    children: [
      { href: "/admin/inquiries", label: "Overview" },
      { href: "/admin/inquiries?tab=pipeline", label: "Pipeline" },
      { href: "/admin/inquiries?tab=schedule", label: "Schedule" },
      { href: "/admin/inquiries?tab=inquiries", label: "Inquiries" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    description: "Quotes, contracts, pricing",
    module: "sales",
    children: [
      { href: "/admin/documents", label: "Documents" },
      { href: "/admin/contracts", label: "Contracts" },
      { href: "/admin/packages", label: "Packages" },
      { href: "/admin/pricing", label: "Pricing" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Income, expenses, payments",
    module: "finance",
    children: [
      { href: "/admin/finance", label: "Overview" },
      { href: "/admin/finance?tab=income", label: "Income" },
      { href: "/admin/finance?tab=expenses", label: "Expenses" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Calendar and partners",
    module: "operations",
    children: [
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/vendors", label: "Vendors" },
    ],
  },
  {
    id: "content",
    label: "Content",
    description: "Homepage and public touchpoints",
    module: "content",
    children: [
      { href: "/admin/flow", label: "Homepage Flow" },
      { href: "/admin/gallery", label: "Gallery" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/social", label: "Social Links" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    description: "Access, roles, workspace",
    module: "settings",
    children: [
      { href: "/admin/settings?tab=users", label: "Users" },
      { href: "/admin/settings", label: "Access & Roles" },
      { href: "/admin/settings?tab=workspace", label: "Workspace" },
      { href: "/admin/settings?tab=modules", label: "Modules" },
    ],
  },
];

function Chevron() {
  return (
    <svg className="admin-nav-group-chevron" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 7 5 5 5-5" />
    </svg>
  );
}

export default function AdminSidebar({
  userEmail: _userEmail,
  userRole,
  allowedModules,
}: {
  userEmail: string | null | undefined;
  userRole: string | null | undefined;
  allowedModules: string[] | null | undefined;
}) {
  const visibleSections = navSections.filter((section) =>
    canAccessModule(userRole, allowedModules, section.module)
  );

  return (
    <aside className="admin-sidebar-shell">
      <div className="admin-sidebar admin-sidebar-panel">
        <div className="admin-sidebar-brand admin-sidebar-brand--simple">
          <h3>Elel Events</h3>
          <p>Business operations</p>
        </div>

        <div className="admin-sidebar-section">
          <nav className="admin-nav admin-nav--stacked" aria-label="Admin navigation">
            {visibleSections.map((section) => {
              if (section.children?.length) {
                return (
                  <details
                    key={section.id}
                    className="admin-nav-group-card"
                    open={section.defaultOpen}
                  >
                    <summary className="admin-nav-group-head">
                      <div>
                        <strong>{section.label}</strong>
                        <span>{section.description}</span>
                      </div>
                      <Chevron />
                    </summary>

                    <div className="admin-nav-subnav admin-nav-subnav--stacked">
                      {section.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="admin-nav-subnav-link"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                );
              }

              return (
                <Link
                  key={section.id}
                  href={section.href || "#"}
                  className="admin-nav-card-link"
                >
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-label">Simple path</p>
          <div className="admin-sidebar-note admin-sidebar-note--plain">
            <p className="muted">
              Latest consultation, quote, contract, payment and secondary follow-up should stay easy to scan.
            </p>
          </div>
          <Link href="/request" className="admin-create-link">
            <span>+</span>
            <strong>New request</strong>
          </Link>
        </div>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-support-link admin-support-link--plain">
            View website
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="admin-signout-button admin-signout-button--plain">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
