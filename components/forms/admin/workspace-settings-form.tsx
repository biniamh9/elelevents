"use client";

import { useState } from "react";
import AdminActionRow from "@/components/admin/admin-action-row";
import type { WorkspaceSettings } from "@/lib/workspace-settings";

export default function WorkspaceSettingsForm({
  initialSettings,
}: {
  initialSettings: WorkspaceSettings;
}) {
  const [form, setForm] = useState({
    business_name: initialSettings.business_name,
    business_type: initialSettings.business_type,
    workspace_label: initialSettings.workspace_label,
    support_email: initialSettings.support_email ?? "",
    support_phone: initialSettings.support_phone ?? "",
    default_currency: initialSettings.default_currency,
    default_timezone: initialSettings.default_timezone,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/settings/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Unable to save workspace settings.");
      return;
    }

    setMessage("Workspace settings saved.");
  }

  return (
    <form className="admin-settings-form" onSubmit={handleSubmit}>
      <div className="admin-dashboard-form-grid">
        <label>
          <span>Business name</span>
          <input
            value={form.business_name}
            onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>Business type</span>
          <input
            value={form.business_type}
            onChange={(event) => setForm((current) => ({ ...current, business_type: event.target.value }))}
            placeholder="Event design, florist, planner, venue..."
            required
          />
        </label>
        <label>
          <span>Workspace label</span>
          <input
            value={form.workspace_label}
            onChange={(event) => setForm((current) => ({ ...current, workspace_label: event.target.value }))}
            placeholder="Admin workspace"
          />
        </label>
        <label>
          <span>Support email</span>
          <input
            type="email"
            value={form.support_email}
            onChange={(event) => setForm((current) => ({ ...current, support_email: event.target.value }))}
          />
        </label>
        <label>
          <span>Support phone</span>
          <input
            value={form.support_phone}
            onChange={(event) => setForm((current) => ({ ...current, support_phone: event.target.value }))}
          />
        </label>
        <label>
          <span>Default currency</span>
          <input
            value={form.default_currency}
            onChange={(event) => setForm((current) => ({ ...current, default_currency: event.target.value.toUpperCase() }))}
          />
        </label>
        <label>
          <span>Default timezone</span>
          <input
            value={form.default_timezone}
            onChange={(event) => setForm((current) => ({ ...current, default_timezone: event.target.value }))}
          />
        </label>
      </div>
      <AdminActionRow
        primary={
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save workspace settings"}
          </button>
        }
      />
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}
