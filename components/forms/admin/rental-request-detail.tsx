"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import StatusBadge from "@/components/forms/admin/status-badge";
import { type RentalQuoteRequest } from "@/lib/rental-requests";
import { formatMoney } from "@/lib/rental-shared";
import type { RentalRequestStatus } from "@/lib/rental-requests.types";

const STATUS_OPTIONS: Array<{ value: RentalRequestStatus; label: string }> = [
  { value: "requested", label: "Requested" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "reserved", label: "Reserved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function RentalRequestDetail({
  request,
}: {
  request: RentalQuoteRequest;
}) {
  const [status, setStatus] = useState<RentalRequestStatus>(request.status);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveUpdates() {
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/rental-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        adminNotes,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to update rental request.");
      return;
    }

    setMessage("Rental request updated.");
  }

  return (
    <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
      <section className="card admin-section-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Rental request</p>
            <h3>{request.first_name} {request.last_name}</h3>
            <p className="muted">{request.email} • {request.phone}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="admin-mini-metrics admin-mini-metrics--plain">
          <div>
            <strong>Occasion</strong>
            <span>{request.occasion_label ?? "Rental quote request"}</span>
          </div>
          <div>
            <strong>Requested date</strong>
            <span>{request.event_date ?? "Pending"}</span>
          </div>
          <div>
            <strong>Venue</strong>
            <span>{request.venue_name ?? "Pending"}</span>
          </div>
          <div>
            <strong>Guest count</strong>
            <span>{request.guest_count ?? "—"}</span>
          </div>
        </div>

        <div className="admin-record-table-shell">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Subtotal</th>
                <th>Deposit</th>
              </tr>
            </thead>
            <tbody>
              {(request.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_price)}</td>
                  <td>{formatMoney(item.line_subtotal)}</td>
                  <td>{formatMoney(item.security_deposit_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-mini-metrics admin-mini-metrics--plain">
          <div>
            <strong>Rental subtotal</strong>
            <span>{formatMoney(request.rental_subtotal)}</span>
          </div>
          <div>
            <strong>Delivery</strong>
            <span>{formatMoney(request.delivery_fee)}</span>
          </div>
          <div>
            <strong>Setup</strong>
            <span>{formatMoney(request.setup_fee)}</span>
          </div>
          <div>
            <strong>Breakdown</strong>
            <span>{formatMoney(request.breakdown_fee)}</span>
          </div>
          <div>
            <strong>Refundable deposit</strong>
            <span>{formatMoney(request.refundable_security_deposit)}</span>
          </div>
          <div>
            <strong>Estimated total</strong>
            <span>{formatMoney(request.estimated_total)}</span>
          </div>
        </div>

        {request.notes ? (
          <Card className="admin-note-card">
            <strong>Client notes</strong>
            <p className="muted">{request.notes}</p>
          </Card>
        ) : null}
      </section>

      <aside className="card admin-section-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Pipeline action</p>
            <h3>Move the request forward</h3>
            <p className="muted">Use explicit rental-stage updates so staff can see exactly where this quote stands.</p>
          </div>
        </div>

        <div className="admin-stack">
          <label className="field">
            <span className="label">Status</span>
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value as RentalRequestStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Internal notes</span>
            <textarea
              className="input"
              rows={8}
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Quote notes, quantity confirmations, logistics constraints, pickup timing, or deposit follow-up."
            />
          </label>

          {message ? <p className="muted">{message}</p> : null}

          <div className="btn-row">
            <Button onClick={saveUpdates}>{saving ? "Saving..." : "Save Updates"}</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
