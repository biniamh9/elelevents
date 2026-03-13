"use client";

import { useState } from "react";

const consultationStatuses = [
  "not_scheduled",
  "requested",
  "scheduled",
  "completed",
  "reschedule_needed",
  "no_show",
];

const consultationTypes = [
  "phone_call",
  "video_meeting",
  "in_person",
  "text_or_email",
];

const quoteResponseStatuses = [
  "not_sent",
  "awaiting_response",
  "accepted",
  "declined",
];

function toLocalInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function ConsultationManagementForm({
  inquiryId,
  initialConsultationStatus,
  initialConsultationType,
  initialConsultationAt,
  initialFollowUpAt,
  initialQuoteResponseStatus,
}: {
  inquiryId: string;
  initialConsultationStatus: string | null;
  initialConsultationType: string | null;
  initialConsultationAt: string | null;
  initialFollowUpAt: string | null;
  initialQuoteResponseStatus: string | null;
}) {
  const [consultationStatus, setConsultationStatus] = useState(
    initialConsultationStatus || "not_scheduled"
  );
  const [consultationType, setConsultationType] = useState(
    initialConsultationType || ""
  );
  const [consultationAt, setConsultationAt] = useState(
    toLocalInputValue(initialConsultationAt)
  );
  const [followUpAt, setFollowUpAt] = useState(
    toLocalInputValue(initialFollowUpAt)
  );
  const [quoteResponseStatus, setQuoteResponseStatus] = useState(
    initialQuoteResponseStatus || "not_sent"
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultation_status: consultationStatus,
        consultation_type: consultationType || null,
        consultation_at: consultationAt ? new Date(consultationAt).toISOString() : null,
        follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : null,
        quote_response_status: quoteResponseStatus,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save consultation details.");
      return;
    }

    setMessage("Consultation details saved.");
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h4 style={{ marginBottom: "10px" }}>Consultation and Follow-Up</h4>
      <div className="form-grid">
        <div className="field">
          <label className="label">Consultation Status</label>
          <select
            className="input"
            value={consultationStatus}
            onChange={(e) => setConsultationStatus(e.target.value)}
          >
            {consultationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Consultation Type</label>
          <select
            className="input"
            value={consultationType}
            onChange={(e) => setConsultationType(e.target.value)}
          >
            <option value="">Not set</option>
            {consultationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Consultation Date & Time</label>
          <input
            className="input"
            type="datetime-local"
            value={consultationAt}
            onChange={(e) => setConsultationAt(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Follow-Up Date & Time</label>
          <input
            className="input"
            type="datetime-local"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Quote Response</label>
          <select
            className="input"
            value={quoteResponseStatus}
            onChange={(e) => setQuoteResponseStatus(e.target.value)}
          >
            {quoteResponseStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="btn secondary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Consultation Details"}
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}
