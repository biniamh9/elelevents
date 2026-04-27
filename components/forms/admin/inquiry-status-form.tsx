"use client";

import { useEffect, useId, useState } from "react";
import { CRM_LOST_REASONS, CRM_OWNER_SUGGESTIONS } from "@/lib/crm-options";

const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];

export default function InquiryStatusForm({
  inquiryId,
  currentStatus,
  currentNotes,
  currentOwner,
  currentLostReason,
}: {
  inquiryId: string;
  currentStatus: string;
  currentNotes: string | null;
  currentOwner: string | null;
  currentLostReason: string | null;
}) {
  const [status, setStatus] = useState(currentStatus || "new");
  const [notes, setNotes] = useState(currentNotes || "");
  const [owner, setOwner] = useState(currentOwner || "");
  const [lostReason, setLostReason] = useState(currentLostReason || "");
  const [message, setMessage] = useState("");
  const ownerSuggestionsId = useId();

  useEffect(() => {
    if (status !== "closed_lost") {
      setLostReason("");
    }
  }, [status]);

  async function handleSave() {
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        admin_notes: notes,
        crm_owner: owner.trim() || null,
        lost_reason: status === "closed_lost" ? lostReason || null : null,
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

      <div className="field">
        <label className="label">CRM Owner</label>
        <input
          className="input"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          list={ownerSuggestionsId}
          placeholder="Assign an owner"
        />
        <datalist id={ownerSuggestionsId}>
          {CRM_OWNER_SUGGESTIONS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      {status === "closed_lost" ? (
        <div className="field">
          <label className="label">Lost Reason</label>
          <select
            className="input"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          >
            <option value="">Select a reason</option>
            {CRM_LOST_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button type="button" className="btn" onClick={handleSave}>
        Save Changes
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}
