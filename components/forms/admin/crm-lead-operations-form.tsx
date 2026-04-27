"use client";

import { useId, useState } from "react";
import { CRM_OWNER_SUGGESTIONS } from "@/lib/crm-options";

function toLocalInputValue(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function CrmLeadOperationsForm({
  inquiryId,
  initialOwner,
  initialNextAction,
  initialNextActionDueAt,
  initialLeadScore,
  initialLeadTemperature,
}: {
  inquiryId: string;
  initialOwner: string | null;
  initialNextAction: string | null;
  initialNextActionDueAt: string | null;
  initialLeadScore: number | null;
  initialLeadTemperature: string | null;
}) {
  const ownerSuggestionsId = useId();
  const [owner, setOwner] = useState(initialOwner ?? "");
  const [nextAction, setNextAction] = useState(initialNextAction ?? "");
  const [nextActionDueAt, setNextActionDueAt] = useState(
    toLocalInputValue(initialNextActionDueAt)
  );
  const [leadScore, setLeadScore] = useState(
    initialLeadScore === null || initialLeadScore === undefined ? "" : String(initialLeadScore)
  );
  const [leadTemperature, setLeadTemperature] = useState(initialLeadTemperature ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crm_owner: owner.trim() || null,
        crm_next_action: nextAction.trim() || null,
        crm_next_action_due_at: nextActionDueAt
          ? new Date(nextActionDueAt).toISOString()
          : null,
        crm_lead_score: leadScore === "" ? null : Number(leadScore),
        crm_lead_temperature: leadTemperature || null,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to save CRM operations.");
      return;
    }

    setMessage("CRM operations saved.");
  }

  return (
    <div className="admin-stack">
      <div className="field">
        <label className="label">Owner</label>
        <input
          className="input"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          list={ownerSuggestionsId}
          placeholder="Assign a CRM owner"
        />
        <datalist id={ownerSuggestionsId}>
          {CRM_OWNER_SUGGESTIONS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label className="label">Next action</label>
        <input
          className="input"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="Revise quote, send contract, call client"
        />
      </div>

      <div className="field">
        <label className="label">Due at</label>
        <input
          className="input"
          type="datetime-local"
          value={nextActionDueAt}
          onChange={(e) => setNextActionDueAt(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label">Lead score</label>
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
        <label className="label">Temperature</label>
        <select
          className="input"
          value={leadTemperature}
          onChange={(e) => setLeadTemperature(e.target.value)}
        >
          <option value="">Not set</option>
          <option value="hot">hot</option>
          <option value="warm">warm</option>
          <option value="cold">cold</option>
        </select>
      </div>

      <button type="button" className="btn secondary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save CRM operations"}
      </button>

      {message ? <p>{message}</p> : null}
    </div>
  );
}
