"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import StatusBadge from "@/components/forms/admin/status-badge";
import { type RentalQuoteRequest } from "@/lib/rental-requests";
import { formatMoney } from "@/lib/rental-shared";
import { formatDeliveryFeeLabel, RENTAL_REFUNDABLE_DEPOSIT_NOTE } from "@/lib/rental-quote-pricing";
import type { RentalRequestStatus } from "@/lib/rental-requests.types";

const STATUS_OPTIONS: Array<{ value: RentalRequestStatus; label: string }> = [
  { value: "requested", label: "Requested" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "paid", label: "Paid" },
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
  const [distanceMiles, setDistanceMiles] = useState(
    request.quote?.distance_miles?.toString() ?? request.distance_miles?.toString() ?? ""
  );
  const initialChairQuantity = request.quote?.chair_quantity
    ?? (request.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  const [chairUnitPrice, setChairUnitPrice] = useState(
    request.quote?.chair_unit_price?.toString()
      ?? (initialChairQuantity > 0 ? (request.rental_subtotal / initialChairQuantity).toFixed(2) : "0")
  );
  const [quoteNotes, setQuoteNotes] = useState(request.quote?.quote_notes ?? RENTAL_REFUNDABLE_DEPOSIT_NOTE);
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

  async function runQuoteAction(action: "generate_quote" | "send_quote" | "mark_paid" | "mark_completed") {
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/rental-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        distanceMiles: distanceMiles ? Number(distanceMiles) : null,
        chairUnitPrice: chairUnitPrice ? Number(chairUnitPrice) : 0,
        quoteNotes,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to update rental quote.");
      return;
    }

    const labels = {
      generate_quote: "Rental quote generated.",
      send_quote: "Rental quote marked sent to customer.",
      mark_paid: "Rental quote marked paid.",
      mark_completed: "Rental request marked completed.",
    };
    setMessage(labels[action]);
    window.location.reload();
  }

  const quote = request.quote;

  return (
    <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
      <section className="card admin-section-card admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Rental request</p>
            <h3>{request.first_name} {request.last_name}</h3>
            <p className="muted">{request.email ?? "No email"} • {request.phone ?? "No phone"}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="admin-reference-head-pills">
          <span className="admin-reference-head-pill admin-reference-head-pill--strong">
            {request.occasion_label ?? "Rental quote request"}
          </span>
          <span className="admin-reference-head-pill">Event date</span>
          <span className="admin-reference-head-pill">{request.event_date ?? "Pending"}</span>
          <span className="admin-reference-head-pill">Guest count</span>
          <span className="admin-reference-head-pill">{request.guest_count ?? "—"}</span>
          <span className="admin-reference-head-pill">Estimated total</span>
          <span className="admin-reference-head-pill">{formatMoney(request.estimated_total)}</span>
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
            <strong>Event address</strong>
            <span>{request.event_address ?? "Pending"}</span>
          </div>
          <div>
            <strong>Event ZIP</strong>
            <span>{request.event_zip ?? "Pending"}</span>
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
            <span>{formatMoney(quote?.chair_subtotal ?? request.rental_subtotal)}</span>
          </div>
          <div>
            <strong>Distance from 30083</strong>
            <span>{quote?.distance_miles ?? request.distance_miles ?? "Admin review"} miles</span>
          </div>
          <div>
            <strong>Mileage delivery</strong>
            <span>{quote ? formatDeliveryFeeLabel(quote) : formatMoney(request.delivery_fee)}</span>
          </div>
          <div>
            <strong>Setup</strong>
            <span>{formatMoney(quote?.setup_fee ?? request.setup_fee)}</span>
          </div>
          <div>
            <strong>Breakdown</strong>
            <span>{formatMoney(quote?.breakdown_fee ?? request.breakdown_fee)}</span>
          </div>
          <div>
            <strong>Refundable deposit</strong>
            <span>{formatMoney(quote?.refundable_deposit ?? request.refundable_security_deposit)}</span>
          </div>
          <div>
            <strong>Total quote</strong>
            <span>{formatMoney(quote?.total_quote ?? request.estimated_total)}</span>
          </div>
        </div>

        <div className="admin-record-grid admin-record-grid--three">
          <Card className="admin-note-card">
            <strong>Customer Information</strong>
            <p className="muted">{request.first_name} {request.last_name}</p>
            <p className="muted">{request.email ?? "No email"} • {request.phone ?? "No phone"}</p>
          </Card>
          <Card className="admin-note-card">
            <strong>Event Information</strong>
            <p className="muted">{request.venue_name ?? "Venue pending"}</p>
            <p className="muted">{request.event_address ?? "Address pending"} {request.event_zip ?? ""}</p>
          </Card>
          <Card className="admin-note-card">
            <strong>Refundable Deposit</strong>
            <p className="muted">{formatMoney(quote?.refundable_deposit ?? request.refundable_security_deposit)}</p>
            <p className="muted">Minimum $500. More than 100 chairs adds $10 per chair.</p>
          </Card>
        </div>

        {request.notes ? (
          <Card className="admin-note-card">
            <strong>Client notes</strong>
            <p className="muted">{request.notes}</p>
          </Card>
        ) : null}
      </section>

      <aside className="card admin-section-card admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Pipeline action</p>
            <h3>Move the request forward</h3>
            <p className="muted">Use explicit rental-stage updates so staff can see exactly where this quote stands.</p>
          </div>
        </div>

        <div className="admin-stack">
          <label className="field">
            <span className="label">Distance from storage ZIP 30083</span>
            <input
              className="input"
              type="number"
              min={0}
              step="0.1"
              value={distanceMiles}
              onChange={(event) => setDistanceMiles(event.target.value)}
              placeholder="Enter mileage after route review"
            />
          </label>

          <label className="field">
            <span className="label">Chair unit price</span>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={chairUnitPrice}
              onChange={(event) => setChairUnitPrice(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="label">Quote notes</span>
            <textarea
              className="input"
              rows={5}
              value={quoteNotes}
              onChange={(event) => setQuoteNotes(event.target.value)}
            />
          </label>

          <div className="btn-row">
            <Button onClick={() => runQuoteAction("generate_quote")}>
              {saving ? "Working..." : "Generate Quote"}
            </Button>
            <Button variant="secondary" onClick={() => runQuoteAction("send_quote")}>
              Send Quote to Customer
            </Button>
            <Button variant="secondary" onClick={() => runQuoteAction("mark_paid")}>
              Mark as Paid
            </Button>
            <Button variant="secondary" onClick={() => runQuoteAction("mark_completed")}>
              Mark as Completed
            </Button>
          </div>

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
