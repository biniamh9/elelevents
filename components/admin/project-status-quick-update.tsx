"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EVENT_PROJECT_STATUSES,
  EVENT_PROJECT_STATUS_LABELS,
  normalizeEventProjectStatus,
  type EventProjectStatus,
} from "@/lib/project-lifecycle";

export default function ProjectStatusQuickUpdate({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus?: string | null;
}) {
  const router = useRouter();
  const normalized = normalizeEventProjectStatus(currentStatus) ?? "new_inquiry";
  const [status, setStatus] = useState<EventProjectStatus>(normalized);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/event-projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Could not update status.");
        return;
      }
      setMessage("Status updated.");
      router.refresh();
    } catch {
      setMessage("Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="project-status-quick-update">
      <label className="label" htmlFor={`project-status-${projectId}`}>
        Update status
      </label>
      <div className="project-status-quick-update__controls">
        <select
          id={`project-status-${projectId}`}
          className="input"
          value={status}
          onChange={(event) => setStatus(event.target.value as EventProjectStatus)}
          disabled={saving}
        >
          {EVENT_PROJECT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {EVENT_PROJECT_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn secondary"
          onClick={updateStatus}
          disabled={saving || status === normalized}
        >
          {saving ? "Updating..." : "Update"}
        </button>
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
