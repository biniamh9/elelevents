"use client";

import { useState } from "react";

export default function BookingOperationsPanel({
  contractId,
  depositAmount,
  depositPaid,
  balancePaid,
  paymentStatus,
  remainingBalance,
  bookingStage,
  recordCashPaymentHref,
  openInvoicePaymentHref,
  createInvoiceHref,
}: {
  contractId: string;
  depositAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  paymentStatus: string;
  remainingBalance: number;
  bookingStage: string;
  recordCashPaymentHref?: string | null;
  openInvoicePaymentHref?: string | null;
  createInvoiceHref?: string | null;
}) {
  const [finalBalancePaid, setFinalBalancePaid] = useState(balancePaid);
  const [depositReceived, setDepositReceived] = useState(depositPaid);
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

  async function updateDepositPaid(nextValue: boolean) {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deposit_paid: nextValue }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to update deposit.");
      return;
    }

    setDepositReceived(nextValue);
    setMessage(nextValue ? "Deposit recorded." : "Deposit reopened.");
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
          <strong>{depositReceived ? "Paid" : "Pending"}</strong>
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
            checked={depositReceived}
            onChange={(e) => updateDepositPaid(e.target.checked)}
            disabled={saving}
          />
          <span>Deposit received</span>
        </label>
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
        {!depositReceived ? (
          <button
            type="button"
            className="btn"
            onClick={() => updateDepositPaid(true)}
            disabled={saving || depositAmount <= 0}
          >
            {saving ? "Saving..." : "Record Deposit"}
          </button>
        ) : (
          <button
            type="button"
            className="btn secondary"
            onClick={() => updateDepositPaid(false)}
            disabled={saving}
          >
            {saving ? "Saving..." : "Reopen Deposit"}
          </button>
        )}
      </div>

      {!depositReceived && depositAmount <= 0 ? (
        <p className="admin-finance-payment-actions-message">
          Set the deposit amount first, then record the deposit.
        </p>
      ) : null}

      <div className="contract-payment-actions">
        <div className="contract-payment-actions-copy">
          <p className="eyebrow">Payment entry</p>
          <h4>Cash and offline payments</h4>
          <p className="muted">
            Record cash, check, Zelle, or transfer from the invoice payment entry so the balance updates and a receipt is created.
          </p>
        </div>
        <div className="contract-email-actions">
          {recordCashPaymentHref ? (
            <a href={recordCashPaymentHref} className="btn">
              Record Cash Payment
            </a>
          ) : null}
          {openInvoicePaymentHref ? (
            <a href={openInvoicePaymentHref} className="btn secondary">
              Open Invoice Payment Entry
            </a>
          ) : null}
          {!recordCashPaymentHref && createInvoiceHref ? (
            <a href={createInvoiceHref} className="btn secondary">
              Create Invoice First
            </a>
          ) : null}
        </div>
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
