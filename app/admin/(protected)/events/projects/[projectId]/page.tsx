import Link from "next/link";
import { notFound } from "next/navigation";
import AdminDetailTabs from "@/components/admin/admin-detail-tabs";
import FollowUpTaskList from "@/components/admin/follow-up-task-list";
import CustomerTimeline from "@/components/admin/customer-timeline";
import ProjectStatusQuickUpdate from "@/components/admin/project-status-quick-update";
import {
  buildContractDetailHref,
  buildCrmCustomerDetailHref,
  buildCrmLeadDetailHref,
  buildDocumentDetailHref,
  buildInvoiceCreateHref,
  buildQuoteCreateHref,
} from "@/lib/admin-navigation";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import {
  getEventProjectById,
  getEventProjectByInquiryId,
  getEventProjectSupport,
} from "@/lib/event-projects";
import {
  deriveEventProjectStatusFromLegacy,
  humanizeEventProjectStatus,
} from "@/lib/project-lifecycle";
import { getCommercialDocumentStatus } from "@/lib/quote-workflow";
import { requireAdminPage } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export default async function AdminEventProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireAdminPage("operations");

  const { projectId } = await params;
  const support = await getEventProjectSupport(supabaseAdmin);
  const realProject =
    (await getEventProjectById(supabaseAdmin, projectId)) ??
    (await getEventProjectByInquiryId(supabaseAdmin, projectId));
  const fallbackInquiryId = realProject ? null : projectId;

  const [
    { data: inquiryRecord },
    { data: clientRecord },
    { data: contractRecord },
    { data: documents },
    { data: payments },
    { data: interactions },
    { data: tasks },
    { data: projectActivity },
    { data: inquiryActivity },
    { data: workflowTransitions },
  ] = await Promise.all([
    (realProject?.inquiry_id ?? fallbackInquiryId)
      ? supabaseAdmin
          .from("event_inquiries")
          .select("id, first_name, last_name, email, phone, status, booking_stage, event_type, event_date, venue_name, guest_count, services, preferred_contact_method, estimated_price, consultation_at")
          .eq("id", realProject?.inquiry_id ?? fallbackInquiryId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    (realProject?.client_id ?? null)
      ? supabaseAdmin
          .from("clients")
          .select("id, full_name, first_name, last_name, email, phone, preferred_contact_method")
          .eq("id", realProject?.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    support.contractsProjectColumn
      ? supabaseAdmin
          .from("contracts")
          .select("id, contract_status, contract_total, deposit_amount, balance_due, deposit_paid, signed_at, inquiry_id")
          .eq("event_project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : (realProject?.inquiry_id ?? fallbackInquiryId)
        ? supabaseAdmin
            .from("contracts")
            .select("id, contract_status, contract_total, deposit_amount, balance_due, deposit_paid, signed_at, inquiry_id")
            .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    support.documentsProjectColumn
      ? supabaseAdmin
          .from("client_documents")
          .select("id, document_number, document_type, status, total_amount, balance_due, created_at")
          .eq("event_project_id", projectId)
          .order("created_at", { ascending: false })
      : (realProject?.inquiry_id ?? fallbackInquiryId)
        ? supabaseAdmin
            .from("client_documents")
            .select("id, document_number, document_type, status, total_amount, balance_due, created_at")
            .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    support.paymentsProjectColumn
      ? supabaseAdmin
          .from("contract_payments")
          .select("id, payment_kind, amount, due_date, paid_at, status, contract_id")
          .eq("event_project_id", projectId)
          .order("created_at", { ascending: false })
      : (realProject?.inquiry_id ?? fallbackInquiryId)
        ? supabaseAdmin
            .from("contract_payments")
            .select("id, payment_kind, amount, due_date, paid_at, status, contract_id")
            .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    support.interactionsProjectColumn
      ? supabaseAdmin
          .from("customer_interactions")
          .select("id, subject, body_text, created_at, channel, direction")
          .eq("event_project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(40)
      : (realProject?.inquiry_id ?? fallbackInquiryId)
        ? supabaseAdmin
            .from("customer_interactions")
            .select("id, subject, body_text, created_at, channel, direction")
            .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
            .order("created_at", { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] }),
    support.tasksProjectColumn
      ? supabaseAdmin
          .from("crm_follow_up_tasks")
          .select("id, inquiry_id, title, detail, task_kind, status, due_at, created_at, owner_name")
          .eq("event_project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(40)
      : (realProject?.inquiry_id ?? fallbackInquiryId)
        ? supabaseAdmin
            .from("crm_follow_up_tasks")
            .select("id, inquiry_id, title, detail, task_kind, status, due_at, created_at, owner_name")
            .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
            .order("created_at", { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from("activity_log")
      .select("id, action, summary, created_at")
      .eq("entity_type", "event_project")
      .eq("entity_id", projectId)
      .order("created_at", { ascending: false })
      .limit(40),
    (realProject?.inquiry_id ?? fallbackInquiryId)
      ? supabaseAdmin
          .from("activity_log")
          .select("id, action, summary, created_at")
          .eq("entity_type", "inquiry")
          .eq("entity_id", realProject?.inquiry_id ?? fallbackInquiryId)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
    (realProject?.inquiry_id ?? fallbackInquiryId)
      ? supabaseAdmin
          .from("workflow_transitions")
          .select("id, from_stage, to_stage, source_action, note, created_at")
          .eq("inquiry_id", realProject?.inquiry_id ?? fallbackInquiryId)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
  ]);

  const inquiryId = realProject?.inquiry_id ?? inquiryRecord?.id ?? fallbackInquiryId;
  const clientId = realProject?.client_id ?? null;
  const project = realProject
    ? realProject
    : inquiryRecord
      ? {
          id: projectId,
          inquiry_id: inquiryRecord.id,
          client_id: null,
          project_name: `${inquiryRecord.event_type || "Event"} · ${[inquiryRecord.first_name, inquiryRecord.last_name].filter(Boolean).join(" ").trim() || "Client"}`,
          event_type: inquiryRecord.event_type,
          event_date: inquiryRecord.event_date,
          venue_name: inquiryRecord.venue_name,
          guest_count: inquiryRecord.guest_count,
          services: inquiryRecord.services,
          investment_range: null,
          status: deriveEventProjectStatusFromLegacy({
            inquiryStatus: inquiryRecord.status,
            bookingStage: inquiryRecord.booking_stage,
            contractStatus: contractRecord?.contract_status ?? null,
            paymentStatus: (payments ?? []).some((payment) => payment.status === "paid") ? "paid" : "pending",
          }),
          assigned_to: null,
          next_action: null,
          next_action_due_at: null,
          contract_status: contractRecord?.contract_status ?? null,
          payment_status: (payments ?? []).some((payment) => payment.status === "paid") ? "paid" : "pending",
        }
      : null;

  if (!project) {
    notFound();
  }

  const documentIds = (documents ?? []).map((document) => document.id);
  const paymentIds = (payments ?? []).map((payment) => payment.id);
  const { data: documentActivity } = documentIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("id, action, summary, created_at")
        .eq("entity_type", "document")
        .in("entity_id", documentIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{ id: string; action: string; summary: string | null; created_at: string }> };
  const { data: paymentActivity } = paymentIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("id, action, summary, created_at")
        .eq("entity_type", "payment")
        .in("entity_id", paymentIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{ id: string; action: string; summary: string | null; created_at: string }> };

  const timelineItems = buildCustomerTimeline({
    workflowTransitions: workflowTransitions ?? [],
    activityLog: [
      ...(projectActivity ?? []),
      ...(inquiryActivity ?? []),
      ...(documentActivity ?? []),
      ...(paymentActivity ?? []),
    ],
    customerInteractions: (interactions ?? []).map((item) => ({
      id: item.id,
      subject: item.subject,
      body_text: item.body_text,
      created_at: item.created_at,
      direction: item.direction,
      channel: item.channel,
    })),
    followUpTasks: (tasks ?? []).map((task) => ({
      id: task.id,
      leadId: task.inquiry_id ?? inquiryId ?? projectId,
      title: task.title,
      status: task.status,
      dueLabel: task.due_at ? `Due ${formatDate(task.due_at)}` : "No due date",
      detail: task.detail ?? undefined,
    })),
    recordHref: inquiryId ? buildCrmLeadDetailHref(inquiryId) : undefined,
      workflowHref: inquiryId ? buildCrmLeadDetailHref(inquiryId) : undefined,
    contractHref: contractRecord?.id ? buildContractDetailHref(contractRecord.id) : null,
  }).slice(0, 40);

  const outstandingBalance = (payments ?? [])
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const latestQuote =
    (documents ?? []).find((document) => document.document_type === "quote") ?? null;
  const latestInvoice =
    (documents ?? []).find((document) => document.document_type === "invoice") ?? null;
  const latestReceipt =
    (documents ?? []).find((document) => document.document_type === "receipt") ?? null;
  const recordPaymentHref = latestInvoice
    ? buildDocumentDetailHref(latestInvoice.id, {
        openPayment: true,
        paymentMethod: "cash",
      })
    : null;
  const recommendedAction = !latestQuote
    ? {
        label: "Create quote",
        detail: "Start the client-facing scope and pricing from this project.",
        href: inquiryId ? buildQuoteCreateHref({ inquiryId }) : null,
        tone: "record" as const,
      }
    : !contractRecord
      ? {
          label: "Create contract",
          detail: "Move accepted scope into the agreement and deposit workflow.",
          href: inquiryId ? buildCrmLeadDetailHref(inquiryId) : null,
          tone: "record" as const,
        }
      : outstandingBalance > 0 && recordPaymentHref
        ? {
            label: "Pay / Record Payment",
            detail: "Record cash, Zelle, check, transfer, or card payment against the invoice.",
            href: recordPaymentHref,
            tone: "record" as const,
          }
        : {
            label: "Update project status",
            detail: "Keep the lifecycle current so CRM, finance, and reporting stay aligned.",
            href: null,
            tone: "internal" as const,
          };
  const projectTasks = [
    {
      label: latestQuote ? "Review or revise quote" : "Create quote",
      detail: latestQuote
        ? "A quote exists for this project. Open it when scope or pricing needs an update."
        : "Build the client-facing scope and pricing.",
      state: latestQuote ? "complete" : "current",
      href: inquiryId
        ? latestQuote
          ? buildDocumentDetailHref(latestQuote.id)
          : buildQuoteCreateHref({ inquiryId })
        : null,
      action: latestQuote ? "Open quote" : "Create quote",
    },
    {
      label: "Prepare contract",
      detail: contractRecord
        ? "The agreement exists. Review signing and deposit requirements."
        : "Create the agreement after the quote scope is ready.",
      state: contractRecord ? "complete" : latestQuote ? "current" : "blocked",
      href: contractRecord?.id
        ? buildContractDetailHref(contractRecord.id)
        : inquiryId && latestQuote
          ? buildCrmLeadDetailHref(inquiryId)
          : null,
      action: contractRecord ? "Open contract" : "Create contract",
    },
    {
      label: "Prepare invoice",
      detail: latestInvoice
        ? "An invoice exists and is ready for payment tracking."
        : "Create the customer payment request.",
      state: latestInvoice ? "complete" : contractRecord ? "current" : "blocked",
      href: latestInvoice
        ? buildDocumentDetailHref(latestInvoice.id)
        : inquiryId && contractRecord
          ? buildInvoiceCreateHref({ inquiryId, contractId: contractRecord.id })
          : null,
      action: latestInvoice ? "Open invoice" : "Create invoice",
    },
    {
      label: "Record customer payment",
      detail:
        latestInvoice && outstandingBalance <= 0
          ? "No outstanding invoice balance remains."
          : "Record deposits, partial payments, or the final payment.",
      state:
        latestInvoice && outstandingBalance <= 0
          ? "complete"
          : latestInvoice
            ? "current"
            : "blocked",
      href: recordPaymentHref,
      action: "Record payment",
    },
    {
      label: "Send or review receipt",
      detail: latestReceipt
        ? "A payment receipt exists for this project."
        : "A receipt is created after payment is recorded.",
      state: latestReceipt ? "complete" : latestInvoice && outstandingBalance <= 0 ? "current" : "blocked",
      href: latestReceipt ? buildDocumentDetailHref(latestReceipt.id) : null,
      action: latestReceipt ? "Open receipt" : "Receipt pending",
    },
  ] as const;
  const serviceList = Array.isArray(project.services)
    ? project.services.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{project.project_name || "Event project"}</h1>
          <p>Use this as the durable operations record for the event, commercial state, files, and workflow activity.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/inquiries?tab=schedule" className="admin-head-pill">
            Back to Events
          </Link>
          {clientId ? (
            <Link href={buildCrmCustomerDetailHref(clientId)} className="admin-head-pill">
              Open customer hub
            </Link>
          ) : null}
          {inquiryId ? (
            <Link href={buildCrmLeadDetailHref(inquiryId)} className="admin-head-pill">
              Open opportunity
            </Link>
          ) : null}
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Projects hold the durable event ownership layer above inquiry intake: event brief, customer linkage, commercial state, payment progress, and ongoing execution context.
        </p>
      </section>

      <AdminDetailTabs
        tabs={[
          { href: "#overview", label: "Overview" },
          { href: "#next-step", label: "Next Step" },
          { href: "#documents-payments", label: "Documents & Payments" },
          { href: "#scope", label: "Scope" },
          { href: "#follow-up", label: "Follow-Ups", count: (tasks ?? []).filter((task) => task.status === "open").length },
          { href: "#timeline", label: "Timeline" },
        ]}
      />

      <div className="summary-pills">
        <span className="summary-chip">Status: {humanizeEventProjectStatus(project.status)}</span>
        <span className="summary-chip">Event date: {formatDate(project.event_date)}</span>
        <span className="summary-chip">Guest count: {project.guest_count || "Not set"}</span>
        <span className="summary-chip">Outstanding balance: {formatMoney(outstandingBalance)}</span>
      </div>

      <section id="next-step" className="card admin-section-card admin-panel admin-reference-records-shell customer-command-center">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Admin task plan</p>
            <h3>Work this project in order</h3>
            <p className="muted">Complete the highlighted task, then move to the next available step.</p>
          </div>
        </div>
        <div className="project-task-plan">
          <div className="project-task-plan__main">
            <div className="project-task-plan__primary">
              <div>
                <span className="project-task-plan__badge">Recommended now</span>
                <h4>{recommendedAction.label}</h4>
                <p>{recommendedAction.detail}</p>
              </div>
              {recommendedAction.href ? (
                <Link href={recommendedAction.href} className="btn">
                  {recommendedAction.label}
                </Link>
              ) : (
                <span className="summary-chip">Use status control</span>
              )}
            </div>

            <ol className="project-task-checklist">
              {projectTasks.map((task, index) => (
                <li key={task.label} className={`project-task-checklist__item is-${task.state}`}>
                  <span className="project-task-checklist__index" aria-hidden="true">
                    {task.state === "complete" ? "✓" : index + 1}
                  </span>
                  <div>
                    <strong>{task.label}</strong>
                    <span>{task.detail}</span>
                  </div>
                  {task.href ? (
                    <Link href={task.href} className="project-task-checklist__action">
                      {task.action} →
                    </Link>
                  ) : (
                    <span className="project-task-checklist__locked">
                      {task.state === "blocked" ? "Complete prior step" : task.action}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <aside className="project-task-plan__status">
            <p className="eyebrow">Lifecycle control</p>
            <h4>{humanizeEventProjectStatus(project.status)}</h4>
            <p className="muted">Update this only when the project has actually moved to a new lifecycle stage.</p>
            <ProjectStatusQuickUpdate
              projectId={realProject?.id ?? inquiryId ?? projectId}
              currentStatus={project.status}
            />
          </aside>
        </div>
      </section>

      <div className="admin-dashboard-row">
        <section id="overview" className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Project overview</p>
              <h3>Event and ownership summary</h3>
            </div>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Project name</small><span>{project.project_name || "Not set"}</span></div>
            <div><small>Status</small><span>{humanizeEventProjectStatus(project.status)}</span></div>
            <div><small>Event type</small><span>{project.event_type || "Not set"}</span></div>
            <div><small>Event date</small><span>{formatDate(project.event_date)}</span></div>
            <div><small>Venue</small><span>{project.venue_name || "Not set"}</span></div>
            <div><small>Guest count</small><span>{project.guest_count || "Not set"}</span></div>
            <div><small>Investment range</small><span>{project.investment_range || "Not set"}</span></div>
            <div><small>Assigned to</small><span>{project.assigned_to || "Not set"}</span></div>
            <div><small>Next action</small><span>{project.next_action || "Not set"}</span></div>
            <div><small>Next action due</small><span>{formatDate(project.next_action_due_at)}</span></div>
            <div><small>Contract status</small><span>{humanizeEventProjectStatus(project.contract_status || contractRecord?.contract_status)}</span></div>
            <div><small>Payment status</small><span>{humanizeEventProjectStatus(project.payment_status)}</span></div>
          </div>
        </section>

        <aside className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customer</p>
              <h3>Account link</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            <div>
              <strong>{clientRecord?.full_name || [clientRecord?.first_name, clientRecord?.last_name].filter(Boolean).join(" ") || "Not linked"}</strong>
              <span>{clientRecord?.email || inquiryRecord?.email || "No email"}</span>
              <span>{clientRecord?.phone || inquiryRecord?.phone || "No phone"}</span>
            </div>
            {clientId ? (
              <div>
                <strong>
                  <Link href={buildCrmCustomerDetailHref(clientId)}>Open customer account</Link>
                </strong>
                <span>Financials, timeline, and other events</span>
              </div>
            ) : null}
            {inquiryId ? (
              <div>
                <strong>
                  <Link href={buildCrmLeadDetailHref(inquiryId)}>Open active opportunity</Link>
                </strong>
                <span>Sales and workflow context</span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="admin-dashboard-row">
        <section id="documents-payments" className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Commercial state</p>
              <h3>Documents and payments</h3>
            </div>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Contract total</small><span>{formatMoney(contractRecord?.contract_total)}</span></div>
            <div><small>Deposit amount</small><span>{formatMoney(contractRecord?.deposit_amount)}</span></div>
            <div><small>Balance due</small><span>{formatMoney(contractRecord?.balance_due)}</span></div>
            <div><small>Deposit paid</small><span>{contractRecord?.deposit_paid ? "Yes" : "No"}</span></div>
            <div><small>Signed at</small><span>{formatDate(contractRecord?.signed_at)}</span></div>
            <div><small>Outstanding balance</small><span>{formatMoney(outstandingBalance)}</span></div>
          </div>
          <div className="admin-placeholder-list">
            {(documents ?? []).length ? (
              documents!.map((document) => (
                <div key={document.id}>
                  <strong>
                    <Link href={buildDocumentDetailHref(document.id)}>
                      {document.document_number || "Document"} · {document.document_type}
                    </Link>
                  </strong>
                  <span>
                    {getCommercialDocumentStatus({ document, projectStatus: project.status }).label ?? humanizeEventProjectStatus(document.status)} · {formatMoney(document.total_amount)} · {formatDate(document.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div>
                <strong>No linked documents</strong>
                <span>Quotes, invoices, and receipts will appear here when attached to the project.</span>
              </div>
            )}
          </div>
        </section>

        <aside id="scope" className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Services</p>
              <h3>Scope</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {serviceList.length ? (
              serviceList.map((service) => (
                <div key={service}>
                  <strong>{service}</strong>
                </div>
              ))
            ) : (
              <div>
                <strong>No services recorded</strong>
                <span>Project service scope has not been formalized yet.</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      <section id="follow-up" className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Follow-ups</p>
            <h3>Open owner tasks</h3>
            <p className="muted">
              Complete project follow-ups inline so the event timeline stays operationally accurate.
            </p>
          </div>
        </div>
        <FollowUpTaskList tasks={tasks ?? []} />
      </section>

      <section id="timeline" className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3>Project activity and follow-up</h3>
          </div>
        </div>
        <CustomerTimeline items={timelineItems} />
      </section>
    </main>
  );
}
