import Link from "next/link";

import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { buildRentalRequestDetailHref } from "@/lib/admin-navigation";
import StatusBadge from "@/components/forms/admin/status-badge";
import {
  getRentalRequestSummary,
  getRentalRequestTotalLabel,
  type RentalQuoteRequest,
} from "@/lib/rental-requests";

export default function RentalRequestManagement({
  requests,
}: {
  requests: RentalQuoteRequest[];
}) {
  if (!requests.length) {
    return (
      <AdminEmptyState
        eyebrow="Rental requests"
        title="No rental quote requests yet"
        description="Once clients use the rental quote form, requests will land here with their selected items, totals, and logistics needs."
        action={<Link href="/rentals" className="btn">Open Rentals Page</Link>}
      />
    );
  }

  return (
    <section className="admin-record-section">
    <div className="card admin-table-card admin-records-table-card admin-reference-records-shell">
      <AdminSectionHeader
        eyebrow="Rental requests"
        title="Review rental pipeline intake"
        description="These are rental-specific requests, separate from the event design inquiry pipeline."
      />
      <div className="admin-reference-head-pills">
        <span className="admin-reference-head-pill admin-reference-head-pill--strong">
          Showing {requests.length} requests
        </span>
        <span className="admin-reference-head-pill">Requested</span>
        <span className="admin-reference-head-pill">
          {requests.filter((request) => request.status === "requested").length}
        </span>
        <span className="admin-reference-head-pill">Quoted</span>
        <span className="admin-reference-head-pill">
          {requests.filter((request) => request.status === "quoted").length}
        </span>
        <span className="admin-reference-head-pill">Reserved</span>
        <span className="admin-reference-head-pill">
          {requests.filter((request) => request.status === "reserved").length}
        </span>
      </div>

      <div className="admin-record-table-shell">
        <table className="admin-records-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Occasion</th>
              <th>Requested date</th>
              <th>Logistics</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="admin-table-primary">
                    <div>
                      <strong>{request.first_name} {request.last_name}</strong>
                      <span>{request.email}</span>
                    </div>
                  </div>
                </td>
                <td>{getRentalRequestSummary(request)}</td>
                <td>{request.event_date ?? "Pending"}</td>
                <td>
                  <span>
                    {[
                      request.include_delivery ? "Delivery" : null,
                      request.include_setup ? "Setup" : null,
                      request.include_breakdown ? "Breakdown" : null,
                    ].filter(Boolean).join(" • ") || "No logistics requested"}
                  </span>
                </td>
                <td>{getRentalRequestTotalLabel(request)}</td>
                <td><StatusBadge status={request.status} /></td>
                <td>
                  <Link href={buildRentalRequestDetailHref(request.id)} className="admin-record-link">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </section>
  );
}
