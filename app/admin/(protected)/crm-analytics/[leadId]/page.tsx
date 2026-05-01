import Link from "next/link";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import AttachUnmatchedReplyShortcut from "@/components/forms/admin/attach-unmatched-reply-shortcut";
import CrmLeadOperationsForm from "@/components/forms/admin/crm-lead-operations-form";
import { notFound } from "next/navigation";
import CustomerTimeline from "@/components/admin/customer-timeline";
import {
  buildContractDetailHref,
  buildCrmLeadDetailHref,
  buildInquiryDetailHref,
  buildQuoteCreateHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { CRM_STAGE_LABELS } from "@/lib/crm-analytics";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import { getLiveCrmSnapshot } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";
import { getStrongUnmatchedReplyCandidatesByInquiry } from "@/lib/unmatched-inbound-replies";

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

  const unmatchedReplyCandidatesByInquiry =
    await getStrongUnmatchedReplyCandidatesByInquiry([
      {
        id: leadId,
        email: lead.email,
      },
    ]);
  const unmatchedReplyCandidates =
    unmatchedReplyCandidatesByInquiry[leadId] ?? [];
  const hasUnmatchedReplyCandidate = unmatchedReplyCandidates.length > 0;
  const hasSingleStrongUnmatchedReplyCandidate = unmatchedReplyCandidates.length === 1;
  const unmatchedReplyReviewHref = buildUnmatchedReplyReviewHref({
    status: "pending_review",
    replyId: unmatchedReplyCandidates[0]?.replyId ?? null,
  });

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
  const { data: inquiryRecord } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, status, admin_notes, crm_owner, crm_next_action, crm_next_action_due_at, crm_lead_score, crm_lead_temperature")
    .eq("id", leadId)
    .maybeSingle();
  const { data: siblingOpportunities } =
    lead.clientId
      ? await supabaseAdmin
          .from("event_inquiries")
          .select("id, event_type, event_date, venue_name, status, estimated_price, created_at")
          .eq("client_id", lead.clientId)
          .neq("id", leadId)
          .order("created_at", { ascending: false })
          .limit(8)
      : { data: [] as Array<{
          id: string;
          event_type: string | null;
          event_date: string | null;
          venue_name: string | null;
          status: string | null;
          estimated_price: number | null;
          created_at: string;
        }> };

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
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{lead.clientName}</h1>
          <p>{lead.eventType} at {lead.venue} · {formatDate(lead.eventDate)}</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/crm-analytics" className="admin-head-pill">Back to CRM</Link>
          <Link href={buildQuoteCreateHref({ inquiryId: leadId })} className="admin-head-pill">Create quote</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep the active opportunity, customer context, ownership, follow-up pressure, reply review, and account history in one structured lead record
        </p>
      </section>

      <div className="admin-dashboard-row">
        <section className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customer info</p>
              <h3>Relationship overview</h3>
            </div>
          </div>
          <div className="admin-reference-head-pills">
            <span className="admin-reference-head-pill admin-reference-head-pill--strong">
              {CRM_STAGE_LABELS[lead.stage]}
            </span>
            <span className="admin-reference-head-pill">Owner</span>
            <span className="admin-reference-head-pill">{lead.owner}</span>
            <span className="admin-reference-head-pill">Lead score</span>
            <span className="admin-reference-head-pill">{lead.leadScore ?? "Not set"}</span>
            <span className="admin-reference-head-pill">Next action</span>
            <span className="admin-reference-head-pill">{lead.nextAction || "Not set"}</span>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Email</small><span>{lead.email}</span></div>
            <div><small>Phone</small><span>{lead.phone}</span></div>
            <div><small>Budget range</small><span>{lead.budgetRange}</span></div>
            <div><small>Stage</small><span>{CRM_STAGE_LABELS[lead.stage]}</span></div>
            <div><small>Owner</small><span>{lead.owner}</span></div>
            <div><small>Next action</small><span>{lead.nextAction || "Not set"}</span></div>
            <div><small>Next action due</small><span>{lead.nextActionDueAt ? formatDate(lead.nextActionDueAt) : "No due date"}</span></div>
            <div><small>Lead score</small><span>{lead.leadScore ?? "Not set"}</span></div>
            <div><small>Temperature</small><span>{lead.leadTemperature ?? "Not set"}</span></div>
            <div><small>Reply review</small><span>{hasUnmatchedReplyCandidate ? `${unmatchedReplyCandidates.length} pending` : "Clear"}</span></div>
            <div><small>Lost reason</small><span>{lead.lostReason ?? "Not set"}</span></div>
            <div><small>Lost at</small><span>{lead.lostAt ? formatDate(lead.lostAt) : "Not set"}</span></div>
            <div><small>Quote summary</small><span>{lead.quoteSummary}</span></div>
            <div><small>Payment summary</small><span>{lead.paymentSummary}</span></div>
          </div>

          {hasUnmatchedReplyCandidate ? (
            <div className="summary-pills">
              <Link href={unmatchedReplyReviewHref} className="summary-chip">
                Review unmatched reply candidate
              </Link>
              {hasSingleStrongUnmatchedReplyCandidate ? (
                <span className="summary-chip">Safe direct attach available</span>
              ) : null}
            </div>
          ) : null}

          {lead.lostContext ? (
            <div className="admin-placeholder-list">
              <div>
                <strong>Lost context</strong>
                <span>{lead.lostContext}</span>
              </div>
            </div>
          ) : null}

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

        <aside className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">CRM operations</p>
              <h3>Ownership and next action</h3>
            </div>
          </div>
          {inquiryRecord ? (
            <CrmLeadOperationsForm
              inquiryId={leadId}
              initialOwner={inquiryRecord.crm_owner}
              initialNextAction={inquiryRecord.crm_next_action}
              initialNextActionDueAt={inquiryRecord.crm_next_action_due_at}
              initialLeadScore={inquiryRecord.crm_lead_score}
              initialLeadTemperature={inquiryRecord.crm_lead_temperature}
            />
          ) : null}
        </aside>

        <aside className="card admin-section-card admin-panel admin-reference-records-shell">
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

      {hasUnmatchedReplyCandidate ? (
        <section className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Reply review</p>
              <h3>Unmatched reply candidate</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            <div>
              <strong>{unmatchedReplyCandidates[0]?.subject?.trim() || "No subject"}</strong>
              <span>
                From {unmatchedReplyCandidates[0]?.fromEmail ?? lead.email} · held for manual attachment to protect this opportunity timeline.
              </span>
            </div>
          </div>
          <div className="summary-pills">
            <Link href={unmatchedReplyReviewHref} className="summary-chip">
              Open reply review
            </Link>
            <Link href={buildInquiryDetailHref(leadId)} className="summary-chip">
              Open inquiry record
            </Link>
          </div>
          {hasSingleStrongUnmatchedReplyCandidate ? (
            <AttachUnmatchedReplyShortcut
              inquiryId={leadId}
              replyId={unmatchedReplyCandidates[0].replyId}
            />
          ) : null}
        </section>
      ) : null}

      <section className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Client account history</p>
            <h3>Other events for this client</h3>
          </div>
        </div>
        <div className="admin-placeholder-list">
          {siblingOpportunities?.length ? (
            siblingOpportunities.map((event) => (
              <div key={event.id}>
                <strong>
                  <Link href={buildCrmLeadDetailHref(event.id)}>
                    {event.event_type || "Event"}{event.event_date ? ` · ${formatDate(event.event_date)}` : ""}
                  </Link>
                </strong>
                <span>
                  {event.venue_name || "Venue not set"} · {event.status ? event.status.replaceAll("_", " ") : "status not set"} · ${Number(event.estimated_price ?? 0).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div>
              <strong>No other events</strong>
              <span>This timeline is scoped to the active opportunity only.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
