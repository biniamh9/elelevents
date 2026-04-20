import type { CrmTask } from "@/lib/crm-analytics";

export type CustomerTimelineItem = {
  id: string;
  type: "workflow" | "activity" | "interaction" | "task";
  title: string;
  summary: string;
  createdAt: string;
  tone?: "default" | "success" | "warning" | "muted";
};

function humanizeLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildCustomerTimeline(input: {
  workflowTransitions?: Array<{
    id: string;
    from_stage: string | null;
    to_stage: string;
    source_action: string | null;
    note: string | null;
    created_at: string;
  }> | null;
  activityLog?: Array<{
    id: string;
    action: string;
    summary: string | null;
    created_at: string;
  }> | null;
  customerInteractions?: Array<{
    id: string;
    subject: string | null;
    body_text: string;
    created_at: string;
    direction?: string | null;
    channel?: string | null;
  }> | null;
  followUpTasks?: Array<
    | {
        id: string;
        title: string;
        detail?: string | null;
        due_at?: string | null;
        created_at?: string | null;
        status?: string | null;
      }
    | CrmTask
  > | null;
}) {
  const workflowItems: CustomerTimelineItem[] = (input.workflowTransitions ?? []).map((entry) => ({
    id: `workflow-${entry.id}`,
    type: "workflow",
    title: `Moved to ${humanizeLabel(entry.to_stage)}`,
    summary:
      entry.note?.trim() ||
      (entry.from_stage
        ? `Transitioned from ${humanizeLabel(entry.from_stage)} via ${humanizeLabel(entry.source_action)}.`
        : `Workflow initialized via ${humanizeLabel(entry.source_action)}.`),
    createdAt: entry.created_at,
    tone: entry.to_stage === "handoff" ? "success" : "default",
  }));

  const activityItems: CustomerTimelineItem[] = (input.activityLog ?? []).map((entry) => ({
    id: `activity-${entry.id}`,
    type: "activity",
    title: entry.summary?.trim() || humanizeLabel(entry.action),
    summary: humanizeLabel(entry.action),
    createdAt: entry.created_at,
    tone:
      entry.action.includes("accepted") || entry.action.includes("booked")
        ? "success"
        : entry.action.includes("changes_requested") || entry.action.includes("declined")
          ? "warning"
          : "default",
  }));

  const interactionItems: CustomerTimelineItem[] = (input.customerInteractions ?? []).map(
    (entry) => ({
      id: `interaction-${entry.id}`,
      type: "interaction",
      title:
        entry.subject?.trim() ||
        (entry.direction === "inbound" ? "Client reply received" : "Customer interaction"),
      summary: entry.body_text,
      createdAt: entry.created_at,
      tone: entry.direction === "inbound" ? "default" : "muted",
    })
  );

  const taskItems: CustomerTimelineItem[] = (input.followUpTasks ?? []).map((entry) => {
    const createdAt =
      "created_at" in entry && entry.created_at
        ? entry.created_at
        : new Date().toISOString();
    const summary =
      "detail" in entry && entry.detail
        ? entry.detail
        : "dueLabel" in entry
          ? entry.dueLabel
          : "Open follow-up task";
    return {
      id: `task-${entry.id}`,
      type: "task",
      title: entry.title,
      summary,
      createdAt,
      tone:
        summary.toLowerCase().includes("revise quote") ||
        summary.toLowerCase().includes("changes")
          ? "warning"
          : "muted",
    } satisfies CustomerTimelineItem;
  });

  return [...workflowItems, ...activityItems, ...interactionItems, ...taskItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
