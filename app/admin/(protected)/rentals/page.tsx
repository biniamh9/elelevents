import Link from "next/link";

import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import RentalManagement from "@/components/forms/admin/rental-management";
import RentalRequestManagement from "@/components/forms/admin/rental-request-management";
import { buildRentalItemCreateHref, buildRentalWorkspaceHref } from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { getRentalItems } from "@/lib/rentals";
import { getRentalQuoteRequests, getRentalRequestMetrics, type RentalRequestStatus } from "@/lib/rental-requests";

export const dynamic = "force-dynamic";

export default async function AdminRentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  await requireAdminPage("sales");

  const { tab = "requests", status = "all" } = await searchParams;
  const items = await getRentalItems();
  const requests = await getRentalQuoteRequests({
    status: (status as RentalRequestStatus | "all") || "all",
  });
  const requestMetrics = getRentalRequestMetrics(requests);
  const activeCount = items.filter((item) => item.active).length;
  const featuredCount = items.filter((item) => item.featured).length;
  const categoryCount = new Set(items.map((item) => item.category).filter(Boolean)).size;
  const totalUnits = items.reduce((sum, item) => sum + item.available_quantity, 0);
  const rentalWorkspaceState = { tab, status };

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>Rentals</h1>
          <p>Run the rental pipeline separately from event design inquiries while keeping inventory, pricing, and quote intake in one workspace.</p>
        </div>
        <div className="admin-page-head-aside">
          {tab === "inventory" ? (
            <Link href={buildRentalItemCreateHref()} className="admin-head-pill">New rental item</Link>
          ) : (
            <Link href="/rentals" className="admin-head-pill">Open rentals page</Link>
          )}
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep rental requests, availability, featured inventory, and quote status inside one merchandising and operations workflow instead of mixing them into event-only intake
        </p>
      </section>

      <section className="card admin-table-card admin-management-card admin-reference-records-shell">
        <div className="admin-reference-filter-group">
          <p>Workspace</p>
          <div className="admin-documents-chip-row">
            <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: status })} className={`admin-documents-chip${tab === "requests" ? " is-active" : ""}`}>
              Requests
            </Link>
            <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "inventory" })} className={`admin-documents-chip${tab === "inventory" ? " is-active" : ""}`}>
              Inventory
            </Link>
          </div>
        </div>
        {tab === "requests" ? (
          <div className="admin-reference-filter-group">
            <p>Request status</p>
            <div className="admin-documents-chip-row">
              <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: "all" })} className={`admin-documents-chip${status === "all" ? " is-active" : ""}`}>
                All
              </Link>
              <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: "requested" })} className={`admin-documents-chip${status === "requested" ? " is-active" : ""}`}>
                Requested
              </Link>
              <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: "reviewing" })} className={`admin-documents-chip${status === "reviewing" ? " is-active" : ""}`}>
                Reviewing
              </Link>
              <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: "quoted" })} className={`admin-documents-chip${status === "quoted" ? " is-active" : ""}`}>
                Quoted
              </Link>
              <Link href={buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextTab: "requests", nextStatus: "reserved" })} className={`admin-documents-chip${status === "reserved" ? " is-active" : ""}`}>
                Reserved
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <AdminMetricStrip
        items={
          tab === "inventory"
            ? [
                { label: "Total items", value: items.length, note: "All rental records" },
                { label: "Active items", value: activeCount, note: "Visible publicly" },
                { label: "Featured items", value: featuredCount, note: "Priority merchandising" },
                { label: "Categories", value: categoryCount, note: "Distinct rental groups" },
                { label: "Available units", value: totalUnits, note: "Current available quantity" },
              ]
            : [
                { label: "Rental requests", value: requestMetrics.total, note: "All rental quote requests" },
                { label: "Requested", value: requestMetrics.requested, note: "New intake awaiting review", tone: "amber" },
                { label: "Reviewing", value: requestMetrics.reviewing, note: "Being priced or checked", tone: "blue" },
                { label: "Quoted", value: requestMetrics.quoted, note: "Sent to client", tone: "violet" },
                { label: "Reserved", value: requestMetrics.reserved, note: "Ready for fulfillment", tone: "green" },
              ]
        }
      />

      {tab === "requests" ? (
        <RentalRequestManagement requests={requests} />
      ) : (
        <RentalManagement items={items} />
      )}
    </main>
  );
}
