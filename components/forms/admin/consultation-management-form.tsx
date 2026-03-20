"use client";

import { useEffect, useState } from "react";

const consultationStatuses = [
  "not_scheduled",
  "requested",
  "under_review",
  "approved",
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
  initialConsultationLocation,
  initialConsultationVideoLink,
  initialConsultationAdminNotes,
  initialFollowUpAt,
  initialQuoteResponseStatus,
}: {
  inquiryId: string;
  initialConsultationStatus: string | null;
  initialConsultationType: string | null;
  initialConsultationAt: string | null;
  initialConsultationLocation: string | null;
  initialConsultationVideoLink: string | null;
  initialConsultationAdminNotes: string | null;
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
  const [consultationLocation, setConsultationLocation] = useState(
    initialConsultationLocation || ""
  );
  const [consultationVideoLink, setConsultationVideoLink] = useState(
    initialConsultationVideoLink || ""
  );
  const [consultationAdminNotes, setConsultationAdminNotes] = useState(
    initialConsultationAdminNotes || ""
  );
  const [followUpAt, setFollowUpAt] = useState(
    toLocalInputValue(initialFollowUpAt)
  );
  const [quoteResponseStatus, setQuoteResponseStatus] = useState(
    initialQuoteResponseStatus || "not_sent"
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const showConsultationType =
    consultationStatus === "requested" ||
    consultationStatus === "under_review" ||
    consultationStatus === "approved" ||
    consultationStatus === "scheduled" ||
    consultationStatus === "reschedule_needed" ||
    consultationStatus === "completed" ||
    consultationStatus === "no_show";
  const showConsultationAt =
    consultationStatus === "approved" ||
    consultationStatus === "scheduled" ||
    consultationStatus === "reschedule_needed" ||
    consultationStatus === "completed" ||
    consultationStatus === "no_show";
  const showFollowUpAt =
    consultationStatus !== "completed" &&
    consultationStatus !== "not_scheduled";
  const showQuoteResponse = consultationStatus === "completed";

  useEffect(() => {
    if (!showConsultationType) {
      setConsultationType("");
    }

    if (!showConsultationAt) {
      setConsultationAt("");
    }

    if (consultationType !== "in_person") {
      setConsultationLocation("");
    }

    if (consultationType !== "video_meeting") {
      setConsultationVideoLink("");
    }

    if (!showFollowUpAt) {
      setFollowUpAt("");
    }

    if (!showQuoteResponse) {
      setQuoteResponseStatus("not_sent");
    }
  }, [
    showConsultationAt,
    showConsultationType,
    showFollowUpAt,
    showQuoteResponse,
  ]);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultation_status: consultationStatus,
        consultation_type: showConsultationType ? consultationType || null : null,
        consultation_at:
          showConsultationAt && consultationAt
            ? new Date(consultationAt).toISOString()
            : null,
        consultation_location:
          consultationType === "in_person" ? consultationLocation || null : null,
        consultation_video_link:
          consultationType === "video_meeting" ? consultationVideoLink || null : null,
        consultation_admin_notes: consultationAdminNotes || null,
        follow_up_at:
          showFollowUpAt && followUpAt
            ? new Date(followUpAt).toISOString()
            : null,
        quote_response_status: showQuoteResponse ? quoteResponseStatus : "not_sent",
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save consultation details.");
      return;
    }

    setMessage(data.consultationEmailMessage || "Consultation details saved.");
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

        {showConsultationType ? (
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
        ) : null}

        {showConsultationAt ? (
          <div className="field">
            <label className="label">Consultation Date & Time</label>
            <input
              className="input"
              type="datetime-local"
              value={consultationAt}
              onChange={(e) => setConsultationAt(e.target.value)}
            />
          </div>
        ) : null}

        {showConsultationType && consultationType === "in_person" ? (
          <div className="field">
            <label className="label">Meeting Location</label>
            <input
              className="input"
              value={consultationLocation}
              onChange={(e) => setConsultationLocation(e.target.value)}
              placeholder="Address or meeting location"
            />
          </div>
        ) : null}

        {showConsultationType && consultationType === "video_meeting" ? (
          <div className="field">
            <label className="label">Video Link</label>
            <input
              className="input"
              value={consultationVideoLink}
              onChange={(e) => setConsultationVideoLink(e.target.value)}
              placeholder="Optional now, can be sent later"
            />
          </div>
        ) : null}

        {showFollowUpAt ? (
          <div className="field">
            <label className="label">Follow-Up Date & Time</label>
            <input
              className="input"
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
            />
          </div>
        ) : null}

        {showQuoteResponse ? (
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
        ) : null}
      </div>

      <div className="field" style={{ marginTop: "16px" }}>
        <label className="label">Admin Notes</label>
        <textarea
          className="textarea"
          value={consultationAdminNotes}
          onChange={(e) => setConsultationAdminNotes(e.target.value)}
          placeholder="Internal context for the meeting only."
        />
      </div>

      <button type="button" className="btn secondary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Consultation Details"}
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}
