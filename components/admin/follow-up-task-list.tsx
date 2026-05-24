"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type AdminFollowUpTask = {
  id: string;
  title: string;
  detail?: string | null;
  task_kind?: string | null;
  status?: string | null;
  due_at?: string | null;
  created_at?: string | null;
  owner_name?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanize(value?: string | null) {
  if (!value) return "General";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FollowUpTaskList({
  tasks,
  emptyMessage = "No open follow-up tasks.",
}: {
  tasks: AdminFollowUpTask[];
  emptyMessage?: string;
}) {
  const router = useRouter();
  const openTasks = useMemo(
    () => tasks.filter((task) => (task.status ?? "open") === "open"),
    [tasks]
  );
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [notesByTaskId, setNotesByTaskId] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function completeTask(taskId: string) {
    setSavingTaskId(taskId);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/follow-up-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          note: notesByTaskId[taskId]?.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not complete follow-up.");
        return;
      }

      setMessage("Follow-up marked complete.");
      setExpandedTaskId(null);
      router.refresh();
    } catch {
      setMessage("Could not complete follow-up.");
    } finally {
      setSavingTaskId(null);
    }
  }

  if (!openTasks.length) {
    return (
      <div className="admin-follow-up-list admin-follow-up-list--empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-follow-up-list">
      {openTasks.map((task) => {
        const dueAt = task.due_at ? new Date(task.due_at) : null;
        const overdue = dueAt ? dueAt.getTime() < Date.now() : false;
        const expanded = expandedTaskId === task.id;

        return (
          <article key={task.id} className="admin-follow-up-task">
            <div className="admin-follow-up-task__body">
              <div className="admin-follow-up-task__head">
                <strong>{task.title}</strong>
                <span className={overdue ? "status-pill status-pill--danger" : "status-pill"}>
                  {overdue ? "Overdue" : formatDateTime(task.due_at)}
                </span>
              </div>
              {task.detail ? <p>{task.detail}</p> : null}
              <div className="admin-follow-up-task__meta">
                <span>{humanize(task.task_kind)}</span>
                <span>Owner: {task.owner_name?.trim() || "Unassigned"}</span>
              </div>
              {expanded ? (
                <label className="admin-follow-up-note">
                  <span>Add follow-up note</span>
                  <textarea
                    value={notesByTaskId[task.id] ?? ""}
                    onChange={(event) =>
                      setNotesByTaskId((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="What happened before closing this follow-up?"
                    rows={3}
                  />
                </label>
              ) : null}
            </div>
            <div className="admin-follow-up-task__actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                disabled={savingTaskId === task.id}
              >
                {expanded ? "Hide Note" : "Add Follow-Up Note"}
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => completeTask(task.id)}
                disabled={savingTaskId === task.id}
              >
                {savingTaskId === task.id ? "Completing..." : "Mark Complete"}
              </button>
            </div>
          </article>
        );
      })}
      {message ? <p className="admin-follow-up-message">{message}</p> : null}
    </div>
  );
}
