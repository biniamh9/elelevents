"use client";

import { useState } from "react";

export default function PaymentRecordForm({
  documentId,
  onRecorded,
}: {
  documentId: string;
  onRecorded?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitPayment() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount || 0),
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
          <p className="eyebrow">Record Payment</p>
          <h3>Capture deposit or balance</h3>
        </div>
      </div>

      <div className="admin-document-grid">
        <div className="field">
          <label className="label">Amount</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
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
          {loading ? "Recording..." : "Record Payment"}
        </button>
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </section>
  );
}
