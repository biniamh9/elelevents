import type { CrmTask } from "@/lib/crm-analytics";

export type CustomerTimelineActionTone =
  | "internal"
  | "email"
  | "sync"
  | "record";

export type CustomerTimelineItem = {
  id: string;
  type: "workflow" | "activity" | "interaction" | "task";
  title: string;
  summary: string;
  createdAt: string;
  tone?: "default" | "success" | "warning" | "muted";
  actionTone: CustomerTimelineActionTone;
  href: string;
};

function humanizeLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildStageHref(
  stage: string | null | undefined,
  workflowHref: string
) {
  switch (stage) {
    case "intake":
      return `${workflowHref}#intake-stage`;
    case "consultation":
      return `${workflowHref}#consultation-stage`;
    case "quote":
      return `${workflowHref}#quote-stage`;
    case "contract":
      return `${workflowHref}#contract-stage`;
    case "handoff":
      return `${workflowHref}#booking-stage`;
    default:
      return `${workflowHref}#next-action`;
  }
}

function buildActionHref(input: {
  action?: string | null;
  title?: string | null;
  summary?: string | null;
  workflowHref: string;
  recordHref: string;
  contractHref?: string | null;
}) {
  const haystack = `${input.action ?? ""} ${input.title ?? ""} ${input.summary ?? ""}`.toLowerCase();

  if (
    haystack.includes("quote_changes_requested") ||
    haystack.includes("revise quote") ||
    haystack.includes("quote change") ||
    haystack.includes("itemized")
  ) {
    return `${input.workflowHref}#quote-stage`;
  }

  if (
    haystack.includes("quote_accepted") ||
    haystack.includes("quote sent") ||
    haystack.includes("proposal")
  ) {
    return `${input.workflowHref}#quote-stage`;
  }

  if (haystack.includes("consultation")) {
    return `${input.workflowHref}#consultation-stage`;
  }

  if (
    haystack.includes("deposit") ||
    haystack.includes("payment") ||
    haystack.includes("invoice") ||
    haystack.includes("receipt")
  ) {
    return input.contractHref ?? `${input.workflowHref}#contract-stage`;
  }

  if (
    haystack.includes("contract") ||
    haystack.includes("docusign") ||
    haystack.includes("signature")
  ) {
    return input.contractHref ?? `${input.workflowHref}#contract-stage`;
  }

  if (
    haystack.includes("booked") ||
    haystack.includes("handoff") ||
    haystack.includes("vendor") ||
    haystack.includes("walkthrough") ||
    haystack.includes("floor plan")
  ) {
    return `${input.workflowHref}#booking-stage`;
  }

  if (haystack.includes("new inquiry") || haystack.includes("intake")) {
    return `${input.workflowHref}#intake-stage`;
  }

  return `${input.recordHref}#next-action`;
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
  recordHref: string;
  workflowHref?: string;
  contractHref?: string | null;
}) {
  const workflowHref = input.workflowHref ?? input.recordHref;
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
    actionTone: "internal",
    href: buildStageHref(entry.to_stage, workflowHref),
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
    actionTone:
      entry.action.includes("reply")
      || entry.action.includes("quote_accepted")
      || entry.action.includes("quote_changes_requested")
        ? "email"
        : entry.action.includes("docusign")
          ? "sync"
          : entry.action.includes("contract")
              || entry.action.includes("deposit")
              || entry.action.includes("payment")
              || entry.action.includes("booked")
            ? "record"
            : "internal",
    href: buildActionHref({
      action: entry.action,
      title: entry.summary,
      summary: humanizeLabel(entry.action),
      workflowHref,
      recordHref: input.recordHref,
      contractHref: input.contractHref,
    }),
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
      actionTone:
        entry.channel === "email" || entry.direction === "inbound"
          ? "email"
          : "internal",
      href: buildActionHref({
        action: entry.channel,
        title: entry.subject,
        summary: entry.body_text,
        workflowHref,
        recordHref: input.recordHref,
        contractHref: input.contractHref,
      }),
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
      actionTone:
        summary.toLowerCase().includes("reply") ||
        summary.toLowerCase().includes("email")
          ? "email"
          : summary.toLowerCase().includes("deposit") ||
              summary.toLowerCase().includes("contract")
            ? "record"
            : "internal",
      href: buildActionHref({
        title: entry.title,
        summary,
        workflowHref,
        recordHref: input.recordHref,
        contractHref: input.contractHref,
      }),
    } satisfies CustomerTimelineItem;
  });

  return [...workflowItems, ...activityItems, ...interactionItems, ...taskItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
