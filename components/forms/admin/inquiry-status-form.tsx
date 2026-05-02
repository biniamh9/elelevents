"use client";

import { useEffect, useId, useState } from "react";
import {
  CRM_LEAD_TEMPERATURES,
  CRM_LOST_REASONS,
  CRM_OWNER_SUGGESTIONS,
} from "@/lib/crm-options";

const statuses = ["new", "contacted", "quoted", "booked", "closed_lost", "archived"];

function toLocalInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function InquiryStatusForm({
  inquiryId,
  currentStatus,
  currentNotes,
  currentOwner,
  currentLostReason,
  currentNextAction,
  currentNextActionDueAt,
  currentLeadScore,
  currentLeadTemperature,
  currentLostContext,
}: {
  inquiryId: string;
  currentStatus: string;
  currentNotes: string | null;
  currentOwner: string | null;
  currentLostReason: string | null;
  currentNextAction: string | null;
  currentNextActionDueAt: string | null;
  currentLeadScore: number | null;
  currentLeadTemperature: string | null;
  currentLostContext: string | null;
}) {
  const [status, setStatus] = useState(currentStatus || "new");
  const [notes, setNotes] = useState(currentNotes || "");
  const [owner, setOwner] = useState(currentOwner || "");
  const [lostReason, setLostReason] = useState(currentLostReason || "");
  const [nextAction, setNextAction] = useState(currentNextAction || "");
  const [nextActionDueAt, setNextActionDueAt] = useState(
    toLocalInputValue(currentNextActionDueAt)
  );
  const [leadScore, setLeadScore] = useState(
    currentLeadScore === null || currentLeadScore === undefined ? "" : String(currentLeadScore)
  );
  const [leadTemperature, setLeadTemperature] = useState(currentLeadTemperature || "");
  const [lostContext, setLostContext] = useState(currentLostContext || "");
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
        crm_next_action: nextAction.trim() || null,
        crm_next_action_due_at: nextActionDueAt
          ? new Date(nextActionDueAt).toISOString()
          : null,
        crm_lead_score: leadScore === "" ? null : Number(leadScore),
        crm_lead_temperature: leadTemperature || null,
        lost_reason: status === "closed_lost" ? lostReason || null : null,
        crm_lost_context: status === "closed_lost" ? lostContext.trim() || null : null,
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

      <div className="field">
        <label className="label">Next Action</label>
        <input
          className="input"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="Call client, revise quote, send contract"
        />
      </div>

      <div className="field">
        <label className="label">Next Action Due</label>
        <input
          className="input"
          type="datetime-local"
          value={nextActionDueAt}
          onChange={(e) => setNextActionDueAt(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label">Lead Score</label>
        <input
          className="input"
          type="number"
          min="0"
          max="100"
          value={leadScore}
          onChange={(e) => setLeadScore(e.target.value)}
          placeholder="0-100"
        />
      </div>

      <div className="field">
        <label className="label">Lead Temperature</label>
        <select
          className="input"
          value={leadTemperature}
          onChange={(e) => setLeadTemperature(e.target.value)}
        >
          <option value="">Not set</option>
          {CRM_LEAD_TEMPERATURES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {status === "closed_lost" ? (
        <>
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

          <div className="field">
            <label className="label">Lost Context</label>
            <textarea
              className="textarea"
              value={lostContext}
              onChange={(e) => setLostContext(e.target.value)}
              placeholder="Capture why this opportunity closed without booking."
            />
          </div>
        </>
      ) : null}

      <button type="button" className="btn" onClick={handleSave}>
        Save Changes
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}
