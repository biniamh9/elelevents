import Link from "next/link";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { notFound } from "next/navigation";
import CustomerTimeline from "@/components/admin/customer-timeline";
import {
  buildContractDetailHref,
  buildCrmLeadDetailHref,
  buildInquiryDetailHref,
  buildQuoteCreateHref,
} from "@/lib/admin-navigation";
import { CRM_STAGE_LABELS } from "@/lib/crm-analytics";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import { getLiveCrmSnapshot } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskPriority(task: { status: string; title: string }) {
  if (task.title.toLowerCase().includes("revise quote")) return 0;
  if (task.status === "overdue") return 1;
  if (task.status === "today") return 2;
  if (task.status === "contract") return 3;
  if (task.status === "deposit") return 4;
  if (task.status === "awaiting_reply") return 5;
  return 6;
}

function getTaskActionTone(task: { status: string; title: string }) {
  const title = task.title.toLowerCase();

  if (title.includes("reply") || task.status === "awaiting_reply") {
    return "email" as const;
  }

  if (title.includes("deposit") || task.status === "deposit" || task.status === "contract") {
    return "record" as const;
  }

  return "internal" as const;
}

export default async function AdminCrmLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  await requireAdminPage("crm");

  const { leadId } = await params;
  const crmSnapshot = await getLiveCrmSnapshot(supabaseAdmin, { inquiryId: leadId });
  const lead = crmSnapshot.leads[0] ?? null;

  if (!lead) {
    notFound();
  }

  const { data: persistedInteractions } = await supabaseAdmin
    .from("customer_interactions")
    .select("id, subject, body_text, created_at, channel, direction, provider")
    .eq("inquiry_id", leadId)
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: activityLog } = await supabaseAdmin
    .from("activity_log")
    .select("id, action, summary, created_at")
    .eq("entity_type", "inquiry")
    .eq("entity_id", leadId)
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: workflowTransitions } = await supabaseAdmin
    .from("workflow_transitions")
    .select("id, from_stage, to_stage, source_action, note, created_at")
    .eq("inquiry_id", leadId)
    .order("created_at", { ascending: false })
    .limit(20);

  const combinedTasks = crmSnapshot.tasks.sort((a, b) => {
    const priorityDiff = getTaskPriority(a) - getTaskPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });
  const contractHref = lead.contractId ? buildContractDetailHref(lead.contractId) : null;

  const unifiedTimeline = buildCustomerTimeline({
    workflowTransitions,
    activityLog,
    customerInteractions: (persistedInteractions ?? []).map((item) => ({
      id: item.id,
      subject: item.subject,
      body_text: item.body_text,
      created_at: item.created_at,
      direction: item.direction,
      channel: item.channel,
    })),
    followUpTasks: combinedTasks,
    recordHref: buildCrmLeadDetailHref(leadId),
    workflowHref: buildInquiryDetailHref(leadId),
    contractHref,
  }).slice(0, 24);

  return (
    <main className="admin-page section admin-page--workspace">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">CRM &amp; Analytics</p>
          <h1>{lead.clientName}</h1>
          <p className="lead">{lead.eventType} at {lead.venue} · {formatDate(lead.eventDate)}</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/crm-analytics" className="admin-topbar-pill">Back to CRM</Link>
          <Link href={buildQuoteCreateHref({ inquiryId: leadId })} className="btn">Create quote</Link>
        </div>
      </div>

      <div className="admin-dashboard-row">
        <section className="card admin-section-card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customer info</p>
              <h3>Relationship overview</h3>
            </div>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Email</small><span>{lead.email}</span></div>
            <div><small>Phone</small><span>{lead.phone}</span></div>
            <div><small>Budget range</small><span>{lead.budgetRange}</span></div>
            <div><small>Stage</small><span>{CRM_STAGE_LABELS[lead.stage]}</span></div>
            <div><small>Quote summary</small><span>{lead.quoteSummary}</span></div>
            <div><small>Payment summary</small><span>{lead.paymentSummary}</span></div>
          </div>

          <div id="notes" className="admin-placeholder-list">
            {lead.notes.length ? (
              lead.notes.map((note) => (
                <div key={note}>
                  <strong>Note</strong>
                  <span>{note}</span>
                </div>
              ))
            ) : (
              <div>
                <strong>Note</strong>
                <span>No additional CRM notes have been recorded yet.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="card admin-section-card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Follow-up tasks</p>
              <h3>Next actions</h3>
            </div>
          </div>
          <div id="tasks" className="crm-task-list">
            {combinedTasks.map((task) => (
              <AdminWorkflowAction
                key={task.id}
                href={buildCrmLeadDetailHref(leadId)}
                className="crm-task-row admin-workflow-action--menu"
                tone={getTaskActionTone(task)}
                label={task.title}
                description={`${task.detail || "Open follow-up task"} · ${task.dueLabel}`}
              />
            ))}
          </div>
        </aside>
      </div>

      <CustomerTimeline
        eyebrow="Client timeline"
        title="Workflow, replies, and internal actions"
        description="This combines workflow transitions, client replies, admin activity, and open follow-up work."
        items={unifiedTimeline}
        emptyMessage="No CRM timeline entries yet."
      />
    </main>
  );
}
