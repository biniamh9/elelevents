"use client";

import { useState } from "react";

export default function BookingOperationsPanel({
  contractId,
  depositPaid,
  balancePaid,
  paymentStatus,
  remainingBalance,
  bookingStage,
}: {
  contractId: string;
  depositPaid: boolean;
  balancePaid: boolean;
  paymentStatus: string;
  remainingBalance: number;
  bookingStage: string;
}) {
  const [finalBalancePaid, setFinalBalancePaid] = useState(balancePaid);
  const [saving, setSaving] = useState(false);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateBalancePaid(nextValue: boolean) {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance_paid: nextValue }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to update final payment.");
      return;
    }

    setFinalBalancePaid(nextValue);
    setMessage("Payment tracking updated.");
  }

  async function sendEmail(type: string) {
    setSendingType(type);
    setMessage("");

    const res = await fetch(`/api/admin/contracts/${contractId}/booking-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setSendingType(null);

    if (!res.ok) {
      setMessage(data.error || "Failed to send email.");
      return;
    }

    setMessage("Customer email sent.");
  }

  return (
    <div className="card contract-operations-card">
      <p className="eyebrow">Booking operations</p>
      <h3>Payment and customer follow-up</h3>
      <div className="contract-operations-grid">
        <div className="contract-operations-metric">
          <span>Booking stage</span>
          <strong>{bookingStage}</strong>
        </div>
        <div className="contract-operations-metric">
          <span>Payment status</span>
          <strong>{paymentStatus}</strong>
        </div>
        <div className="contract-operations-metric">
          <span>Deposit</span>
          <strong>{depositPaid ? "Paid" : "Pending"}</strong>
        </div>
        <div className="contract-operations-metric">
          <span>Remaining balance</span>
          <strong>${remainingBalance.toLocaleString()}</strong>
        </div>
      </div>

      <div className="booking-prep-grid">
        <label className="checkline">
          <input
            type="checkbox"
            checked={finalBalancePaid}
            onChange={(e) => updateBalancePaid(e.target.checked)}
            disabled={saving}
          />
          <span>Final payment received</span>
        </label>
      </div>

      <div className="contract-email-actions">
        <button
          type="button"
          className="btn secondary"
          onClick={() => sendEmail("deposit_receipt")}
          disabled={sendingType !== null}
        >
          {sendingType === "deposit_receipt" ? "Sending..." : "Send Deposit Receipt"}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => sendEmail("final_payment_reminder")}
          disabled={sendingType !== null}
        >
          {sendingType === "final_payment_reminder" ? "Sending..." : "Send Final Payment Reminder"}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => sendEmail("final_payment_confirmation")}
          disabled={sendingType !== null}
        >
          {sendingType === "final_payment_confirmation" ? "Sending..." : "Send Final Payment Confirmation"}
        </button>
      </div>

      {message ? <p style={{ margin: 0 }}>{message}</p> : null}
    </div>
  );
}
