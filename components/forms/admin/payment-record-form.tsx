"use client";

import { useState } from "react";

export default function PaymentRecordForm({
  documentId,
  onRecorded,
  initialPaymentMethod = "bank_transfer",
  invoiceTotal = 0,
  amountPaid = 0,
  balanceDue,
}: {
  documentId: string;
  onRecorded?: () => void;
  initialPaymentMethod?: string;
  invoiceTotal?: number;
  amountPaid?: number;
  balanceDue?: number;
}) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const remainingBalance = Number(balanceDue ?? Math.max(invoiceTotal - amountPaid, 0));
  const parsedAmount = Number(amount || 0);

  function formatMoney(value: number) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function submitPayment() {
    if (remainingBalance <= 0) {
      setMessage("This invoice is already fully paid. No remaining balance is available to record.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage("Enter a payment amount greater than $0.");
      return;
    }

    if (parsedAmount > remainingBalance) {
      setMessage("Payment amount cannot be greater than the remaining invoice balance.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          notes: notes || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Failed to record payment.");
        return;
      }
      setMessage("Payment recorded. Receipt draft created automatically.");
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      onRecorded?.();
    } catch {
      setMessage("Failed to record payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card admin-document-section">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Pay invoice</p>
          <h3>Record customer payment</h3>
          <p className="muted">
            Add the exact amount received. Partial payments update the invoice balance, and a receipt draft is created automatically.
          </p>
        </div>
      </div>

      <div className="invoice-payment-summary">
        <div>
          <span>Total invoice</span>
          <strong>${formatMoney(invoiceTotal)}</strong>
        </div>
        <div>
          <span>Already paid</span>
          <strong>${formatMoney(amountPaid)}</strong>
        </div>
        <div>
          <span>Remaining balance</span>
          <strong>${formatMoney(remainingBalance)}</strong>
        </div>
      </div>

      <div className="admin-document-grid">
        <div className="field">
          <label className="label">Partial payment amount</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount received"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <p className="muted">
            Enter the amount the customer paid now. Use the full balance only when the invoice is fully paid.
          </p>
        </div>
        <div className="field">
          <label className="label">Payment Date</label>
          <input
            className="input"
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Payment Method</label>
          <select
            className="input"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="zelle">Zelle</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
          </select>
          {paymentMethod === "cash" ? (
            <p className="muted">Use notes for cash-handling details if no reference number applies.</p>
          ) : null}
        </div>
        <div className="field">
          <label className="label">Reference Number</label>
          <input
            className="input"
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
          />
        </div>
        <div className="field field--full">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>

      <div className="admin-document-inline-actions">
        <button type="button" className="btn" onClick={submitPayment} disabled={loading}>
          {loading ? "Recording..." : "Pay / Record Payment"}
        </button>
        {remainingBalance > 0 ? (
          <button
            type="button"
            className="btn secondary"
            onClick={() => setAmount(String(remainingBalance))}
            disabled={loading}
          >
            Use full balance
          </button>
        ) : null}
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </section>
  );
}
