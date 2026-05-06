import Link from "next/link";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import CrmInteractionsFeed from "@/components/admin/crm-interactions-feed";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { requireAdminPage } from "@/lib/auth/admin";
import { getLiveCrmMetrics } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  buildCrmLeadDetailHref,
  buildCrmWorkspaceHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import {
  getStrongUnmatchedReplyCandidatesByInquiry,
  getUnmatchedInboundReplies,
} from "@/lib/unmatched-inbound-replies";
import type { CrmTask } from "@/lib/crm-analytics";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskPriority(task: Pick<CrmTask, "status" | "title" | "entityType">) {
  if (task.entityType === "unmatched_reply") return 0;
  if (task.entityType === "rental_request") return 0;
  if (task.title.toLowerCase().includes("revise quote")) return 1;
  if (task.status === "overdue") return 2;
  if (task.status === "today") return 3;
  if (task.status === "contract") return 4;
  if (task.status === "deposit") return 5;
  if (task.status === "awaiting_reply") return 6;
  return 7;
}

function getTaskActionTone(task: Pick<CrmTask, "status" | "title" | "entityType">) {
  const title = task.title.toLowerCase();

  if (task.entityType === "unmatched_reply") return "email" as const;
  if (task.entityType === "rental_request") {
    return task.status === "awaiting_reply" ? "email" as const : "record" as const;
  }
  if (title.includes("reply") || task.status === "awaiting_reply") return "email" as const;
  if (title.includes("deposit") || task.status === "deposit" || task.status === "contract") {
    return "record" as const;
  }
  return "internal" as const;
}

export default async function AdminCrmTasksRoute() {
  await requireAdminPage("crm");

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const pendingUnmatchedReplies = await getUnmatchedInboundReplies({
    reviewStatus: "pending_review",
    limit: 12,
  });

  const unmatchedReplyCandidatesByInquiry =
    await getStrongUnmatchedReplyCandidatesByInquiry(
      crmMetrics.leads.map((lead) => ({
        id: lead.id,
        email: lead.email,
      }))
    );

  const leadsById = new Map(crmMetrics.leads.map((lead) => [lead.id, lead]));
  const unmatchedReplyTasks: CrmTask[] = pendingUnmatchedReplies.map((reply) => ({
    id: `unmatched-reply-${reply.id}`,
    leadId: reply.id,
    title: "Review unmatched reply",
    status: "today",
    dueLabel: "Manual reply review pending",
    detail: `${reply.from_email} · ${reply.subject?.trim() || "No subject"}`,
    href: buildUnmatchedReplyReviewHref({
      status: "pending_review",
      replyId: reply.id,
    }),
    entityType: "unmatched_reply",
  }));

  const combinedTasks = [...unmatchedReplyTasks, ...crmMetrics.tasks].sort((a, b) => {
    const priorityDiff = getTaskPriority(a) - getTaskPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });

  const unmatchedReplyCandidateCounts = Object.fromEntries(
    crmMetrics.leads.map((lead) => [
      lead.id,
      unmatchedReplyCandidatesByInquiry[lead.id]?.length ?? 0,
    ])
  );

  const summary = {
    overdue: combinedTasks.filter((task) => task.status === "overdue").length,
    today: combinedTasks.filter((task) => task.status === "today").length,
    awaitingReply: combinedTasks.filter((task) => task.status === "awaiting_reply").length,
    deposits: combinedTasks.filter((task) => task.status === "deposit").length,
    contracts: combinedTasks.filter((task) => task.status === "contract").length,
    replyReview: pendingUnmatchedReplies.length,
  };

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>CRM Tasks</h1>
          <p>Use tasks as the lifecycle execution queue for follow-up, contract signatures, deposits, reply review, and overdue actions.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-head-pill">Open pipeline</Link>
          <Link href={buildCrmWorkspaceHref("leads")} className="admin-head-pill">Open leads</Link>
          <Link href={buildCrmWorkspaceHref("reports")} className="admin-head-pill">Open reports</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          This route is dedicated to actionable CRM work only. It no longer shares the reporting renderer so task execution and insight reporting stay separate.
        </p>
      </section>

      <div className="admin-workspace-tabs admin-workspace-tabs--inline admin-reference-tabs">
        <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-workspace-tab">Pipeline</Link>
        <Link href={buildCrmWorkspaceHref("leads")} className="admin-workspace-tab">Leads / Inquiries</Link>
        <Link href={buildCrmWorkspaceHref("customers")} className="admin-workspace-tab">Customers</Link>
        <Link href={buildCrmWorkspaceHref("tasks")} className="admin-workspace-tab is-active">Tasks</Link>
        <Link href={buildCrmWorkspaceHref("reports")} className="admin-workspace-tab">Reports</Link>
      </div>

      <div className="summary-pills">
        <span className="summary-chip">Overdue: {summary.overdue}</span>
        <span className="summary-chip">Due today: {summary.today}</span>
        <span className="summary-chip">Awaiting reply: {summary.awaitingReply}</span>
        <span className="summary-chip">Deposits: {summary.deposits}</span>
        <span className="summary-chip">Contracts: {summary.contracts}</span>
        <span className="summary-chip">Reply review: {summary.replyReview}</span>
      </div>

      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <section className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <AdminSectionHeader
            eyebrow="Task center"
            title="Actionable lifecycle queue"
            description="This queue keeps deposit follow-through, contract signatures, quote revisions, reply review, and overdue follow-up in one place."
          />
          <div className="crm-task-list">
            {combinedTasks.map((task) => {
              const lead = leadsById.get(task.leadId);
              const taskHref =
                task.entityType === "unmatched_reply"
                  ? task.href
                  : task.entityType === "rental_request"
                    ? task.href
                    : lead
                      ? buildCrmLeadDetailHref(lead.id)
                      : task.href;

              return (
                <AdminWorkflowAction
                  key={task.id}
                  href={taskHref}
                  className="crm-task-row admin-workflow-action--menu"
                  tone={getTaskActionTone(task)}
                  label={task.entityType === "rental_request" ? `${task.title} · Rental` : task.title}
                  description={`${task.detail || (lead ? `${lead.clientName} · ${lead.eventType}` : "Lead")} · ${task.dueLabel || `Due ${formatDate((task as { due_at?: string | null }).due_at)}`}`}
                />
              );
            })}
          </div>
        </section>
        <CrmInteractionsFeed items={crmMetrics.interactions.slice(0, 12)} leadsById={leadsById} />
      </div>

      <section className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Reply review signals</p>
            <h3>Protected timeline matching</h3>
          </div>
        </div>
        <div className="admin-placeholder-list">
          {crmMetrics.leads
            .filter((lead) => (unmatchedReplyCandidateCounts[lead.id] ?? 0) > 0)
            .slice(0, 8)
            .map((lead) => (
              <div key={lead.id}>
                <strong>
                  <Link href={buildCrmLeadDetailHref(lead.id)}>{lead.clientName}</Link>
                </strong>
                <span>
                  {unmatchedReplyCandidateCounts[lead.id]} unmatched reply candidate{unmatchedReplyCandidateCounts[lead.id] === 1 ? "" : "s"} · {lead.eventType}
                </span>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
