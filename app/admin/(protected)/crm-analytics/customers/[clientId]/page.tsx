import Link from "next/link";
import { notFound } from "next/navigation";
import EmailHistoryPanel from "@/components/admin/email-history-panel";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import CustomerTimeline from "@/components/admin/customer-timeline";
import ProjectStatusQuickUpdate from "@/components/admin/project-status-quick-update";
import {
  buildContractDetailHref,
  buildEventProjectDetailHref,
  buildCrmLeadDetailHref,
  buildDocumentDetailHref,
  buildCrmWorkspaceHref,
  buildInquiryDetailHref,
  buildInvoiceCreateHref,
  buildQuoteCreateHref,
} from "@/lib/admin-navigation";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import { getEventProjectSupport } from "@/lib/event-projects";
import { humanizeEventProjectStatus } from "@/lib/project-lifecycle";
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

export default async function AdminCrmCustomerDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireAdminPage("crm");

  const { clientId } = await params;

  const [
    { data: client },
    { data: inquiries },
    { data: contracts },
    { data: payments },
    { data: interactions },
    { data: tasks },
    { data: clientActivityLog },
  ] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle(),
    supabaseAdmin
      .from("event_inquiries")
      .select("id, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, booking_stage, estimated_price, crm_next_action, crm_next_action_due_at, booked_at, reserved_at, completed_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("contracts")
      .select("id, inquiry_id, client_name, event_type, event_date, contract_total, deposit_amount, balance_due, contract_status, deposit_paid, signed_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("contract_payments")
      .select("id, contract_id, payment_kind, amount, due_date, paid_at, status")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_interactions")
      .select("id, inquiry_id, subject, body_text, created_at, channel, direction, client_id, sender_email, recipient_email, provider, message_id, thread_id, metadata")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabaseAdmin
      .from("crm_follow_up_tasks")
      .select("id, inquiry_id, client_id, title, detail, status, due_at, created_at, updated_at, completed_at, owner_name")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabaseAdmin
      .from("activity_log")
      .select("id, action, summary, created_at")
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (!client) {
    notFound();
  }

  const inquiryIds = (inquiries ?? []).map((item) => item.id);
  const contractIds = (contracts ?? []).map((item) => item.id);
  const projectSupport = await getEventProjectSupport(supabaseAdmin);
  const eventProjects =
    projectSupport.projectsTable && inquiryIds.length
      ? (
          await supabaseAdmin
            .from("event_projects")
            .select("id, inquiry_id, project_name, status, event_date")
            .in("inquiry_id", inquiryIds)
        ).data ?? []
      : [];
  const projectByInquiryId = new Map(
    eventProjects
      .filter((project) => project.inquiry_id)
      .map((project) => [project.inquiry_id as string, project])
  );
  const { data: inquiryActivityLog } = inquiryIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("id, action, summary, created_at")
        .eq("entity_type", "inquiry")
        .in("entity_id", inquiryIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{ id: string; action: string; summary: string | null; created_at: string }> };

  const linkedDocuments =
    inquiryIds.length || contractIds.length
      ? (
          await supabaseAdmin
            .from("client_documents")
            .select("id, inquiry_id, contract_id, document_number, document_type, status, total_amount, balance_due, created_at")
            .or(
              [
                inquiryIds.length ? `inquiry_id.in.(${inquiryIds.join(",")})` : null,
                contractIds.length ? `contract_id.in.(${contractIds.join(",")})` : null,
              ]
                .filter(Boolean)
                .join(",")
            )
        ).data ?? []
      : [];
  const linkedDocumentIds = linkedDocuments.map((document) => document.id);
  const paymentIds = (payments ?? []).map((payment) => payment.id);
  const emailHistory = (interactions ?? []).filter(
    (interaction) => interaction.channel === "email" && interaction.direction === "outbound"
  );
  const { data: documentActivityLog } = linkedDocumentIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("id, action, summary, created_at")
        .eq("entity_type", "document")
        .in("entity_id", linkedDocumentIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{ id: string; action: string; summary: string | null; created_at: string }> };
  const { data: paymentActivityLog } = paymentIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("id, action, summary, created_at")
        .eq("entity_type", "payment")
        .in("entity_id", paymentIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{ id: string; action: string; summary: string | null; created_at: string }> };

  const activeOpportunities = (inquiries ?? []).filter(
    (item) => !["closed_lost", "archived"].includes(item.status ?? "")
  );
  const bookedEvents = (inquiries ?? []).filter(
    (item) => ["reserved", "signed_deposit_paid", "completed"].includes(item.booking_stage ?? "")
  );
  const outstandingBalance = (payments ?? [])
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const latestOpportunity = activeOpportunities[0] ?? inquiries?.[0] ?? null;
  const latestInquiryId = latestOpportunity?.id ?? null;
  const latestProject = latestInquiryId ? projectByInquiryId.get(latestInquiryId) : null;
  const latestContract = latestInquiryId
    ? (contracts ?? []).find((contract) => contract.inquiry_id === latestInquiryId) ?? null
    : null;
  const latestInvoice =
    linkedDocuments
      .filter((document) => document.document_type === "invoice")
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0] ?? null;
  const latestReceipt =
    linkedDocuments
      .filter((document) => document.document_type === "receipt")
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0] ?? null;
  const latestQuote = latestInquiryId
    ? linkedDocuments.find(
        (document) =>
          document.inquiry_id === latestInquiryId && document.document_type === "quote"
      ) ?? null
    : null;
  const recordPaymentHref = latestInvoice
    ? buildDocumentDetailHref(latestInvoice.id, {
        openPayment: true,
        paymentMethod: "cash",
      })
    : null;
  const nextStepTitle = !latestInquiryId
    ? "Create an opportunity first"
    : !latestQuote
      ? "Build and send the quote"
      : !latestContract
        ? "Create the contract"
        : outstandingBalance > 0
          ? "Record payment"
          : "Move project forward";
  const nextStepDetail = !latestInquiryId
    ? "This customer exists, but no inquiry/project is linked yet."
    : !latestQuote
      ? "Start with a client-ready quote so the customer can approve scope and pricing."
      : !latestContract
        ? "Turn the approved scope into a contract and deposit path."
        : outstandingBalance > 0
          ? "Use the invoice payment entry to record cash, Zelle, check, or transfer."
          : "Open the project hub to update planning, handoff, or completion.";
  const nextStepHref = !latestInquiryId
    ? buildCrmWorkspaceHref("leads")
    : !latestQuote
      ? buildQuoteCreateHref({ inquiryId: latestInquiryId })
      : !latestContract
        ? buildInquiryDetailHref(latestInquiryId)
        : recordPaymentHref ??
          (latestProject
            ? buildEventProjectDetailHref(latestProject.id)
            : buildInquiryDetailHref(latestInquiryId));

  const timelineItems = buildCustomerTimeline({
    activityLog:
      [...(clientActivityLog ?? []), ...(inquiryActivityLog ?? [])].map((entry) => ({
        id: entry.id,
        action: entry.action,
        summary: entry.summary,
        created_at: entry.created_at,
      })).concat(documentActivityLog ?? [], paymentActivityLog ?? []) ?? [],
    customerInteractions:
      (interactions ?? []).map((entry) => ({
        id: entry.id,
        subject: entry.subject,
        body_text: entry.body_text,
        created_at: entry.created_at,
        direction: entry.direction,
        channel: entry.channel,
      })) ?? [],
    followUpTasks:
      (tasks ?? []).map((task) => ({
        id: task.id,
        leadId: task.inquiry_id ?? clientId,
        title: task.title,
        status: task.status,
        dueLabel: task.due_at ? `Due ${formatDate(task.due_at)}` : "No due date",
        detail: task.detail ?? undefined,
      })) ?? [],
    recordHref: buildCrmWorkspaceHref("customers"),
    workflowHref: inquiries?.[0] ? buildCrmLeadDetailHref(inquiries[0].id) : buildCrmWorkspaceHref("customers"),
  }).slice(0, 40);

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{client.full_name || `${client.first_name} ${client.last_name}`}</h1>
          <p>Use this as the durable CRM account center across all inquiries, events, documents, and payments.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("customers")} className="admin-head-pill">
            Back to Customers
          </Link>
          {inquiries?.[0] ? (
            <Link
              href={
                buildEventProjectDetailHref(
                  projectByInquiryId.get(inquiries[0].id)?.id || inquiries[0].id
                )
              }
              className="admin-head-pill"
            >
              Open latest project
            </Link>
          ) : null}
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep contact details, open opportunities, booked work, documents, receipts, balances, and communication history attached to one customer account instead of scattering them across inquiry records.
        </p>
      </section>

      <div className="summary-pills">
        <span className="summary-chip">Email: {client.email}</span>
        <span className="summary-chip">Phone: {client.phone || "Not set"}</span>
        <span className="summary-chip">Active opportunities: {activeOpportunities.length}</span>
        <span className="summary-chip">Booked events: {bookedEvents.length}</span>
        <span className="summary-chip">Outstanding balance: {formatMoney(outstandingBalance)}</span>
      </div>

      <section className="card admin-section-card admin-panel admin-reference-records-shell customer-command-center">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Next step</p>
            <h3>{nextStepTitle}</h3>
            <p className="muted">{nextStepDetail}</p>
          </div>
        </div>
        <div className="customer-command-grid">
          <AdminWorkflowAction
            href={nextStepHref}
            tone={outstandingBalance > 0 ? "record" : "internal"}
            label={nextStepTitle}
            description="Recommended next action based on this customer’s linked opportunity, documents, contract, and payment state."
          />
          {latestInquiryId ? (
            <AdminWorkflowAction
              href={buildQuoteCreateHref({ inquiryId: latestInquiryId })}
              tone="record"
              label={latestQuote ? "Revise / create quote" : "Create quote"}
              description="Open the quote builder already linked to this customer’s active opportunity."
            />
          ) : null}
          {latestInquiryId ? (
            <AdminWorkflowAction
              href={buildInvoiceCreateHref({
                inquiryId: latestInquiryId,
                contractId: latestContract?.id ?? null,
              })}
              tone="record"
              label="Create invoice"
              description="Prepare a payment request tied to the same inquiry, customer, and project context."
            />
          ) : null}
          {latestContract ? (
            <AdminWorkflowAction
              href={buildContractDetailHref(latestContract.id)}
              tone={latestContract.deposit_paid ? "sync" : "email"}
              label={latestContract.deposit_paid ? "Open contract" : "Send / collect deposit"}
              description="Open contract signing and deposit tracking."
            />
          ) : latestInquiryId ? (
            <AdminWorkflowAction
              href={buildInquiryDetailHref(latestInquiryId)}
              tone="record"
              label="Create contract"
              description="Open the inquiry workflow contract stage to generate the agreement."
            />
          ) : null}
          {recordPaymentHref ? (
            <AdminWorkflowAction
              href={recordPaymentHref}
              tone="record"
              label="Record payment"
              description="Open the invoice payment entry with cash selected so receipts and balances update."
            />
          ) : latestInquiryId ? (
            <AdminWorkflowAction
              href={buildInvoiceCreateHref({
                inquiryId: latestInquiryId,
                contractId: latestContract?.id ?? null,
              })}
              tone="record"
              label="Create invoice first"
              description="Payments are recorded from invoice documents, so create or open an invoice first."
            />
          ) : null}
          {latestInvoice ? (
            <AdminWorkflowAction
              href={buildDocumentDetailHref(latestInvoice.id)}
              tone="sync"
              label={latestReceipt ? "Open invoice / receipts" : "Generate receipt"}
              description="Open the invoice to generate or review receipt records for this customer."
            />
          ) : null}
          {latestProject ? (
            <AdminWorkflowAction
              href={buildEventProjectDetailHref(latestProject.id)}
              tone="sync"
              label="Open project hub"
              description="Update lifecycle, planning context, handoff, and event readiness."
            />
          ) : latestInquiryId ? (
            <AdminWorkflowAction
              href={buildEventProjectDetailHref(latestInquiryId)}
              tone="sync"
              label="Open project hub"
              description="Open the linked project route, with inquiry fallback if the project record is still being backfilled."
            />
          ) : null}
          {latestInquiryId ? (
            <div className="project-status-command-card">
              <ProjectStatusQuickUpdate
                projectId={latestProject?.id ?? latestInquiryId}
                currentStatus={latestProject?.status ?? latestOpportunity?.status}
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="admin-dashboard-row">
        <section className="card admin-section-card admin-panel admin-panel--wide admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Overview</p>
              <h3>Customer summary</h3>
            </div>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Email</small><span>{client.email}</span></div>
            <div><small>Phone</small><span>{client.phone || "Not set"}</span></div>
            <div><small>Preferred contact</small><span>{client.preferred_contact_method || "Not set"}</span></div>
            <div><small>Source</small><span>{client.source || "Not set"}</span></div>
            <div><small>City</small><span>{client.city || "Not set"}</span></div>
            <div><small>State</small><span>{client.state || "Not set"}</span></div>
            <div><small>Active opportunities</small><span>{activeOpportunities.length}</span></div>
            <div><small>Booked events</small><span>{bookedEvents.length}</span></div>
            <div><small>Documents</small><span>{linkedDocuments.length}</span></div>
            <div><small>Payments</small><span>{payments?.length ?? 0}</span></div>
            <div><small>Outstanding balance</small><span>{formatMoney(outstandingBalance)}</span></div>
            <div><small>Client notes</small><span>{client.notes || "Not set"}</span></div>
          </div>
        </section>

        <aside className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Quick links</p>
              <h3>Current focus</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {activeOpportunities.slice(0, 4).map((inquiry) => (
              <div key={inquiry.id}>
                <strong>
                  <Link
                    href={
                      buildEventProjectDetailHref(
                        projectByInquiryId.get(inquiry.id)?.id || inquiry.id
                      )
                    }
                  >
                    {inquiry.event_type || "Event"} · {formatDate(inquiry.event_date)}
                  </Link>
                </strong>
                <span>
                  {humanizeEventProjectStatus(projectByInquiryId.get(inquiry.id)?.status ?? inquiry.status)}
                </span>
                {projectByInquiryId.get(inquiry.id) ? (
                  <span>Project linked · {projectByInquiryId.get(inquiry.id)!.project_name || "Project record"}</span>
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Event / project portfolio</p>
            <h3>Opportunities and booked events</h3>
          </div>
        </div>
        <div className="admin-placeholder-list">
          {(inquiries ?? []).length ? (
            inquiries!.map((inquiry) => (
              <div key={inquiry.id}>
                <strong>
                  <Link
                    href={
                      buildEventProjectDetailHref(
                        projectByInquiryId.get(inquiry.id)?.id || inquiry.id
                      )
                    }
                  >
                    {inquiry.event_type || "Event"} · {formatDate(inquiry.event_date)}
                  </Link>
                </strong>
                <span>
                  {inquiry.venue_name || "Venue pending"} · {inquiry.guest_count ?? "—"} guests · lifecycle {humanizeEventProjectStatus(projectByInquiryId.get(inquiry.id)?.status ?? inquiry.status)} · next {inquiry.crm_next_action || "Not set"}
                </span>
                {projectByInquiryId.get(inquiry.id) ? (
                  <span>Project: {projectByInquiryId.get(inquiry.id)!.project_name || "Linked record"}</span>
                ) : null}
              </div>
            ))
          ) : (
            <div>
              <strong>No event records</strong>
              <span>This customer does not yet have an inquiry or project linked.</span>
            </div>
          )}
        </div>
      </section>

      <div className="admin-dashboard-row">
        <section className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Financials</p>
              <h3>Documents and balances</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {linkedDocuments.length ? (
              linkedDocuments.map((document) => (
                <div key={document.id}>
                  <strong>
                    <Link href={buildDocumentDetailHref(document.id)}>
                      {document.document_number || document.document_type}
                    </Link>
                  </strong>
                  <span>
                    {document.document_type} · {getCommercialDocumentStatus({ document }).label ?? document.status.replaceAll("_", " ")} · {formatMoney(document.total_amount)} · balance {formatMoney(document.balance_due)} · {formatDate(document.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div>
                <strong>No sales documents</strong>
                <span>No quotes, invoices, or receipts are linked to this customer yet.</span>
              </div>
            )}
          </div>
        </section>

        <section className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Payments</p>
              <h3>Deposit and balance ledger</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {(payments ?? []).length ? (
              payments!.map((payment) => (
                <div key={payment.id}>
                  <strong>{payment.payment_kind.replaceAll("_", " ")}</strong>
                  <span>
                    {formatMoney(payment.amount)} · {payment.status} · due {formatDate(payment.due_date)} · paid {formatDate(payment.paid_at)}
                    {payment.contract_id ? (
                      <> · <Link href={buildContractDetailHref(payment.contract_id)}>Open contract</Link></>
                    ) : null}
                  </span>
                </div>
              ))
            ) : (
              <div>
                <strong>No payment ledger</strong>
                <span>Deposit and balance records will appear here once contracts exist.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <EmailHistoryPanel emails={emailHistory} />

      <CustomerTimeline
        eyebrow="Timeline"
        title="Communication and activity history"
        description="Customer-level history across interactions, CRM tasks, and related record activity."
        items={timelineItems}
        emptyMessage="No customer activity recorded yet."
      />
    </main>
  );
}
