import Link from "next/link";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import AttachUnmatchedReplyShortcut from "@/components/forms/admin/attach-unmatched-reply-shortcut";
import CrmLeadOperationsForm from "@/components/forms/admin/crm-lead-operations-form";
import { notFound } from "next/navigation";
import CustomerTimeline from "@/components/admin/customer-timeline";
import {
  buildContractDetailHref,
  buildCrmLeadDetailHref,
  buildDocumentDetailHref,
  buildInvoiceCreateHref,
  buildInquiryDetailHref,
  buildQuoteCreateHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { CRM_STAGE_LABELS } from "@/lib/crm-analytics";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import { normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
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

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function formatDateOrFallback(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDocumentTypeLabel(value: string) {
  if (value === "quote") return "Quote";
  if (value === "invoice") return "Invoice";
  if (value === "receipt") return "Receipt";
  return value;
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
    .select("id, status, admin_notes, crm_owner, crm_next_action, crm_next_action_due_at, crm_lead_score, crm_lead_temperature, event_type, event_date, venue_name, venue_status, guest_count, services, preferred_contact_method, follow_up_details_json, inspiration_notes, additional_info, colors_theme, estimated_price, consultation_at, booked_at, reserved_at, completed_at")
    .eq("id", leadId)
    .maybeSingle();
  const { data: relatedDocuments } = await supabaseAdmin
    .from("client_documents")
    .select("id, document_number, document_type, status, total_amount, balance_due, created_at, inquiry_id, contract_id")
    .or(
      lead.contractId
        ? `inquiry_id.eq.${leadId},contract_id.eq.${lead.contractId}`
        : `inquiry_id.eq.${leadId}`
    )
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: contractPayments } = lead.contractId
    ? await supabaseAdmin
        .from("contract_payments")
        .select("id, payment_kind, amount, due_date, paid_at, status")
        .eq("contract_id", lead.contractId)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{
        id: string;
        payment_kind: string;
        amount: number | null;
        due_date: string | null;
        paid_at: string | null;
        status: string;
      }> };
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
  const structuredFollowUp = normalizeInquiryFollowUpDetails(
    inquiryRecord?.follow_up_details_json ?? null
  );
  const services =
    inquiryRecord && Array.isArray(inquiryRecord.services)
      ? inquiryRecord.services.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  const relatedDocumentRows = relatedDocuments ?? [];
  const quoteDocuments = relatedDocumentRows.filter((document) => document.document_type === "quote");
  const invoiceDocuments = relatedDocumentRows.filter((document) => document.document_type === "invoice");
  const receiptDocuments = relatedDocumentRows.filter((document) => document.document_type === "receipt");
  const paidPayments = (contractPayments ?? []).filter((payment) => payment.status === "paid");
  const pendingPayments = (contractPayments ?? []).filter((payment) => payment.status !== "paid");
  const projectStatus = lead.bookingStage ?? inquiryRecord?.status ?? "Not set";
  const projectValue =
    Number(lead.estimatedValue ?? 0) > 0
      ? Number(lead.estimatedValue ?? 0)
      : Number(inquiryRecord?.estimated_price ?? 0);

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
          Use this as the active customer and project hub for the opportunity, event brief, sales documents, payment progress, internal ownership, and account history.
        </p>
      </section>

      <div className="summary-pills">
        <a href="#relationship" className="summary-chip">Overview</a>
        <a href="#project" className="summary-chip">Event / Project</a>
        <a href="#financials" className="summary-chip">Financials</a>
        <a href="#files" className="summary-chip">Files & Inspiration</a>
        <a href="#timeline" className="summary-chip">Timeline</a>
        <a href="#account-history" className="summary-chip">Other events</a>
      </div>

      <div className="admin-dashboard-row">
        <section id="relationship" className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customer info</p>
              <h3>Customer and opportunity overview</h3>
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
            <div><small>Consultation preference</small><span>{inquiryRecord?.preferred_contact_method || "Not set"}</span></div>
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

      <div className="admin-dashboard-row">
        <section id="project" className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Event / Project</p>
              <h3>Project brief and planning context</h3>
            </div>
          </div>
          <div className="admin-reference-head-pills">
            <span className="admin-reference-head-pill admin-reference-head-pill--strong">
              {inquiryRecord?.event_type || lead.eventType}
            </span>
            <span className="admin-reference-head-pill">Guest count</span>
            <span className="admin-reference-head-pill">{inquiryRecord?.guest_count ?? "Not set"}</span>
            <span className="admin-reference-head-pill">Project status</span>
            <span className="admin-reference-head-pill">{projectStatus.replaceAll("_", " ")}</span>
            <span className="admin-reference-head-pill">Estimated value</span>
            <span className="admin-reference-head-pill">{formatMoney(projectValue)}</span>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Event date</small><span>{formatDateOrFallback(inquiryRecord?.event_date || lead.eventDate)}</span></div>
            <div><small>Venue</small><span>{inquiryRecord?.venue_name || lead.venue}</span></div>
            <div><small>Venue status</small><span>{inquiryRecord?.venue_status || "Not set"}</span></div>
            <div><small>Guest count</small><span>{inquiryRecord?.guest_count ?? "Not set"}</span></div>
            <div><small>Consultation at</small><span>{formatDateOrFallback(inquiryRecord?.consultation_at || lead.consultationAt)}</span></div>
            <div><small>Reserved at</small><span>{formatDateOrFallback(inquiryRecord?.reserved_at)}</span></div>
            <div><small>Booked at</small><span>{formatDateOrFallback(inquiryRecord?.booked_at || lead.bookedAt)}</span></div>
            <div><small>Completed at</small><span>{formatDateOrFallback(inquiryRecord?.completed_at)}</span></div>
            <div><small>Services requested</small><span>{services.length ? services.join(", ") : "Not set"}</span></div>
            <div><small>Color / theme</small><span>{inquiryRecord?.colors_theme || "Not set"}</span></div>
            <div><small>Vision notes</small><span>{inquiryRecord?.inspiration_notes || "Not set"}</span></div>
            <div><small>Additional brief</small><span>{inquiryRecord?.additional_info || "Not set"}</span></div>
          </div>
        </section>

        <aside id="financials" className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Financials</p>
              <h3>Documents and payments</h3>
            </div>
          </div>
          <div className="summary-pills">
            <Link href={buildQuoteCreateHref({ inquiryId: leadId })} className="summary-chip">
              Create quote
            </Link>
            <Link
              href={buildInvoiceCreateHref({ inquiryId: leadId, contractId: lead.contractId })}
              className="summary-chip"
            >
              Create invoice
            </Link>
            {contractHref ? (
              <Link href={contractHref} className="summary-chip">
                Open contract
              </Link>
            ) : (
              <Link href={buildInquiryDetailHref(leadId)} className="summary-chip">
                Open inquiry workflow
              </Link>
            )}
          </div>
          <div className="admin-placeholder-list">
            <div>
              <strong>Quotes</strong>
              <span>{quoteDocuments.length ? `${quoteDocuments.length} linked` : "No quote created yet"}</span>
            </div>
            <div>
              <strong>Invoices</strong>
              <span>{invoiceDocuments.length ? `${invoiceDocuments.length} linked` : "No invoice created yet"}</span>
            </div>
            <div>
              <strong>Receipts</strong>
              <span>{receiptDocuments.length ? `${receiptDocuments.length} linked` : "No receipt created yet"}</span>
            </div>
            <div>
              <strong>Paid payments</strong>
              <span>{paidPayments.length ? `${paidPayments.length} posted` : "No cash recorded yet"}</span>
            </div>
            <div>
              <strong>Pending payments</strong>
              <span>{pendingPayments.length ? `${pendingPayments.length} still open` : "Nothing outstanding"}</span>
            </div>
            <div>
              <strong>Outstanding balance</strong>
              <span>{formatMoney(lead.outstandingBalance ?? 0)}</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Sales record</p>
            <h3>Related documents and payment history</h3>
          </div>
        </div>
        <div className="admin-dashboard-row">
          <div className="admin-placeholder-list">
            {relatedDocumentRows.length ? (
              relatedDocumentRows.map((document) => (
                <div key={document.id}>
                  <strong>
                    <Link href={buildDocumentDetailHref(document.id)}>
                      {document.document_number || formatDocumentTypeLabel(document.document_type)}
                    </Link>
                  </strong>
                  <span>
                    {formatDocumentTypeLabel(document.document_type)} · {document.status} · {formatMoney(document.total_amount)} · created {formatDateOrFallback(document.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div>
                <strong>No sales documents</strong>
                <span>Create quotes, invoices, and receipts from this hub so customer finance history stays connected.</span>
              </div>
            )}
          </div>
          <div className="admin-placeholder-list">
            {(contractPayments ?? []).length ? (
              contractPayments!.map((payment) => (
                <div key={payment.id}>
                  <strong>{payment.payment_kind.replaceAll("_", " ")}</strong>
                  <span>
                    {formatMoney(payment.amount)} · {payment.status} · due {formatDateOrFallback(payment.due_date)} · paid {formatDateOrFallback(payment.paid_at)}
                  </span>
                </div>
              ))
            ) : (
              <div>
                <strong>No payment ledger yet</strong>
                <span>Deposit and balance obligations will appear here once a contract drives the payment schedule.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="files" className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Files and inspiration</p>
            <h3>Vision references and uploaded assets</h3>
          </div>
        </div>
        <div className="admin-dashboard-row">
          <div className="admin-placeholder-list">
            <div>
              <strong>Follow-up note</strong>
              <span>{structuredFollowUp?.note || "No follow-up note recorded."}</span>
            </div>
            <div>
              <strong>Style notes</strong>
              <span>
                {structuredFollowUp?.selected_styles?.length
                  ? structuredFollowUp.selected_styles.join(", ")
                  : "No structured style selections recorded."}
              </span>
            </div>
            <div>
              <strong>Additional inspiration</strong>
              <span>{inquiryRecord?.inspiration_notes || "No inspiration notes recorded."}</span>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {(structuredFollowUp?.inspiration_links?.length || 0) > 0 ? (
              structuredFollowUp!.inspiration_links!.map((link) => (
                <div key={link}>
                  <strong>Reference link</strong>
                  <span><a href={link} target="_blank" rel="noreferrer">{link}</a></span>
                </div>
              ))
            ) : (
              <div>
                <strong>Reference links</strong>
                <span>No shared inspiration links yet.</span>
              </div>
            )}
            {(structuredFollowUp?.uploaded_urls?.length || 0) > 0 ? (
              structuredFollowUp!.uploaded_urls!.map((url) => (
                <div key={url}>
                  <strong>Uploaded file</strong>
                  <span><a href={url} target="_blank" rel="noreferrer">Open uploaded inspiration</a></span>
                </div>
              ))
            ) : (
              <div>
                <strong>Uploaded inspiration</strong>
                <span>No uploaded inspiration files yet.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div id="timeline">
      <CustomerTimeline
        eyebrow="Client timeline"
        title="Workflow, replies, and internal actions"
        description="This combines workflow transitions, client replies, admin activity, and open follow-up work."
        items={unifiedTimeline}
        emptyMessage="No CRM timeline entries yet."
      />
      </div>

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

      <section id="account-history" className="card admin-section-card admin-panel admin-reference-records-shell">
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
