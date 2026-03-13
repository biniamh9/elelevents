"use client";

import { useState } from "react";

const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];

export default function InquiryStatusForm({
  inquiryId,
  currentStatus,
  currentNotes,
}: {
  inquiryId: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const [status, setStatus] = useState(currentStatus || "new");
  const [notes, setNotes] = useState(currentNotes || "");
  const [message, setMessage] = useState("");

  async function handleSave() {
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        admin_notes: notes,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to save.");
      return;
    }

    setMessage("Saved successfully.");
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <div className="field">
        <label className="label">Status</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">Admin Notes</label>
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="button" className="btn" onClick={handleSave}>
        Save Changes
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}