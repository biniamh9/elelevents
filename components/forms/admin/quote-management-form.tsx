"use client";

import { useState } from "react";

export default function QuoteManagementForm({
  inquiryId,
  currentAmount,
  clientEmail,
  clientName,
}: {
  inquiryId: string;
  currentAmount: number | null;
  clientEmail: string | null;
  clientName: string;
}) {
  const [quoteAmount, setQuoteAmount] = useState(
    currentAmount ? String(currentAmount) : ""
  );
  const [quoteMessage, setQuoteMessage] = useState(
    "Thank you for meeting with us. Based on the event scope we discussed, here is your quote. If you would like to move forward, reply to this email and we will prepare your contract."
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  async function saveQuoteAmount() {
    setSaving(true);
    setMessage("");

    const numericAmount = quoteAmount ? Number(quoteAmount) : null;

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estimated_price: numericAmount,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to save quote amount.");
      setSaving(false);
      return;
    }

    setMessage("Quote amount saved.");
    setSaving(false);
  }

  async function sendQuote() {
    setSending(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}/send-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteAmount: quoteAmount ? Number(quoteAmount) : null,
        quoteMessage,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to send quote email.");
      setSending(false);
      return;
    }

    setMessage("Quote email sent.");
    setSending(false);
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h4 style={{ marginBottom: "10px" }}>Quote Stage</h4>
      <p className="muted">
        Set the agreed quote, email it to the client, then wait for approval before sending DocuSign.
      </p>

      <div className="field">
        <label className="label">Agreed Quote Amount</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={quoteAmount}
          onChange={(e) => setQuoteAmount(e.target.value)}
          placeholder="Enter final quoted price"
        />
      </div>

      <div className="field">
        <label className="label">Quote Email Message</label>
        <textarea
          className="textarea"
          value={quoteMessage}
          onChange={(e) => setQuoteMessage(e.target.value)}
          placeholder="Write the message that goes with the quote."
        />
      </div>

      <p className="muted">
        Sending to: {clientName} {clientEmail ? `(${clientEmail})` : ""}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" className="btn secondary" onClick={saveQuoteAmount} disabled={saving}>
          {saving ? "Saving..." : "Save Quote Amount"}
        </button>
        <button type="button" className="btn" onClick={sendQuote} disabled={sending}>
          {sending ? "Sending..." : "Send Quote Email"}
        </button>
      </div>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}
