"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { canAccessModule, type AdminModule } from "@/lib/admin-access";
import { buildInquiryCreateHref } from "@/lib/admin-navigation";

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
    id: "dashboard",
    label: "Dashboard",
    description: "Business summary",
    module: "overview",
    defaultOpen: true,
    children: [
      { href: "/admin/inquiries", label: "Overview" },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    description: "Leads and follow-up",
    module: "crm",
    children: [
      { href: "/admin/crm-analytics", label: "Pipeline" },
      { href: "/admin/crm-analytics?tab=leads", label: "Leads / Inquiries" },
      { href: "/admin/crm-analytics?tab=customers", label: "Customers" },
      { href: "/admin/crm-analytics?tab=tasks", label: "Tasks" },
    ],
  },
  {
    id: "events",
    label: "Events",
    description: "Projects and schedule",
    module: "operations",
    children: [
      { href: "/admin/inquiries?tab=schedule", label: "Events / Projects" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/vendors", label: "Vendors" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    description: "Documents and contracts",
    module: "sales",
    children: [
      { href: "/admin/documents?type=quote", label: "Quotes" },
      { href: "/admin/documents?type=invoice", label: "Invoices" },
      { href: "/admin/documents?type=receipt", label: "Receipts" },
      { href: "/admin/contracts", label: "Contracts" },
      { href: "/admin/finance?tab=income", label: "Payments" },
    ],
  },
  {
    id: "rentals",
    label: "Rentals",
    description: "Requests and inventory",
    module: "sales",
    children: [
      { href: "/admin/rentals", label: "Rental Requests" },
      { href: "/admin/rentals?tab=inventory", label: "Rental Inventory" },
      { href: "/admin/packages", label: "Packages" },
      { href: "/admin/pricing", label: "Pricing" },
    ],
  },
  {
    id: "content",
    label: "Content",
    description: "Homepage and media",
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

function isHrefActive(
  href: string,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
) {
  const [hrefPath, hrefQuery] = href.split("?");
  if (hrefPath !== pathname) {
    return false;
  }

  if (!hrefQuery) {
    return true;
  }

  const targetParams = new URLSearchParams(hrefQuery);
  for (const [key, value] of targetParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visibleSections = navSections.filter((section) =>
    canAccessModule(userRole, allowedModules, section.module)
  );

  return (
    <aside className="admin-sidebar-shell">
      <div className="admin-sidebar admin-sidebar-panel">
        <div className="admin-sidebar-brand admin-sidebar-brand--simple">
          <h3>Elel Events</h3>
          <p>Admin workspace</p>
        </div>

        <div className="admin-sidebar-section">
          <nav className="admin-nav admin-nav--stacked" aria-label="Admin navigation">
            {visibleSections.map((section) => {
              const childLinks = section.children ?? [];
              const hasActiveChild = childLinks.some((child) =>
                isHrefActive(child.href, pathname, searchParams)
              );
              const isActiveLink = section.href
                ? isHrefActive(section.href, pathname, searchParams)
                : false;

              if (section.children?.length) {
                return (
                  <details
                    key={section.id}
                    className="admin-nav-group-card"
                    open={hasActiveChild || section.defaultOpen}
                  >
                    <summary className={`admin-nav-group-head${hasActiveChild ? " is-active" : ""}`}>
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
                          className={`admin-nav-subnav-link${isHrefActive(child.href, pathname, searchParams) ? " is-active" : ""}`}
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
                  className={`admin-nav-card-link${isActiveLink ? " is-active" : ""}`}
                >
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-section admin-sidebar-section--compact">
          <Link href={buildInquiryCreateHref()} className="admin-create-link">
            <span>+</span>
            <strong>Add Inquiry</strong>
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
