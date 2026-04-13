"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavChild = {
  href: string;
  label: string;
  matchTab?: string;
};

type NavSection = {
  id: string;
  label: string;
  description: string;
  href?: string;
  children?: NavChild[];
};

const navSections: NavSection[] = [
  {
    id: "homepage",
    label: "Homepage now",
    description: "Review for Flow",
    href: "/admin/flow",
  },
  {
    id: "overview",
    label: "Overview",
    description: "Business operations",
    children: [
      { href: "/admin/inquiries", label: "Overview", matchTab: "overview" },
      { href: "/admin/inquiries?tab=pipeline", label: "Pipeline", matchTab: "pipeline" },
      { href: "/admin/inquiries?tab=schedule", label: "Schedule", matchTab: "schedule" },
      { href: "/admin/inquiries?tab=inquiries", label: "Inquiries", matchTab: "inquiries" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    description: "Quotes, contracts, pricing",
    children: [
      { href: "/admin/documents", label: "Documents" },
      { href: "/admin/contracts", label: "Contracts" },
      { href: "/admin/packages", label: "Packages" },
      { href: "/admin/pricing", label: "Pricing" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Calendar and partners",
    children: [
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/vendors", label: "Vendors" },
    ],
  },
  {
    id: "content",
    label: "Content",
    description: "Homepage and public touchpoints",
    children: [
      { href: "/admin/flow", label: "Homepage Flow" },
      { href: "/admin/gallery", label: "Gallery" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/social", label: "Social Links" },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`admin-nav-group-chevron${open ? " is-open" : ""}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="m5 7 5 5 5-5" />
    </svg>
  );
}

export default function AdminSidebar({
  userEmail: _userEmail,
}: {
  userEmail: string | null | undefined;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkspaceTab = searchParams.get("tab") || "overview";

  const activeGroupIds = useMemo(() => {
    const ids = new Set<string>();

    for (const section of navSections) {
      if (section.href && isActivePath(pathname, section.href)) {
        ids.add(section.id);
      }

      if (section.children?.some((child) => {
        const childPath = child.href.split("?")[0];
        if (!isActivePath(pathname, childPath)) return false;
        if (!child.matchTab) return true;
        return activeWorkspaceTab === child.matchTab;
      })) {
        ids.add(section.id);
      }
    }

    ids.add("overview");
    return ids;
  }, [pathname, activeWorkspaceTab]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    sales: false,
    operations: false,
    content: false,
  });

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      for (const id of activeGroupIds) {
        next[id] = true;
      }
      return next;
    });
  }, [activeGroupIds]);

  function toggleGroup(id: string) {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <aside className="admin-sidebar-shell">
      <div className="admin-sidebar admin-sidebar-panel">
        <div className="admin-sidebar-brand admin-sidebar-brand--simple">
          <h3>Elel Events</h3>
          <p>Business operations</p>
        </div>

        <div className="admin-sidebar-section">
          <nav className="admin-nav admin-nav--stacked" aria-label="Admin navigation">
            {navSections.map((section) => {
              const hasChildren = Boolean(section.children?.length);
              const groupOpen = Boolean(openGroups[section.id]);
              const sectionActive = activeGroupIds.has(section.id);

              if (hasChildren) {
                return (
                  <div key={section.id} className="admin-nav-group-card">
                    <button
                      type="button"
                      className={`admin-nav-group-head${sectionActive ? " is-active" : ""}`}
                      onClick={() => toggleGroup(section.id)}
                      aria-expanded={groupOpen}
                    >
                      <div>
                        <strong>{section.label}</strong>
                        <span>{section.description}</span>
                      </div>
                      <Chevron open={groupOpen} />
                    </button>

                    {groupOpen ? (
                      <div className="admin-nav-subnav admin-nav-subnav--stacked">
                        {section.children!.map((child) => {
                          const childPath = child.href.split("?")[0];
                          const active =
                            isActivePath(pathname, childPath) &&
                            (!child.matchTab || activeWorkspaceTab === child.matchTab);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`admin-nav-subnav-link${active ? " is-active" : ""}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const active = section.href ? isActivePath(pathname, section.href) : false;

              return (
                <Link
                  key={section.id}
                  href={section.href || "#"}
                  className={`admin-nav-card-link${active ? " is-active" : ""}`}
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
