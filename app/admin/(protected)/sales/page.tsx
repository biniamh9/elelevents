import Link from "next/link";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import {
  buildCrmCustomerDetailHref,
  buildDocumentDetailHref,
  buildDocumentsLibraryHref,
  buildEventProjectDetailHref,
  buildInvoiceCreateHref,
  buildQuoteCreateHref,
  buildSalesPipelineHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import {
  EVENT_PROJECT_STATUS_LABELS,
  humanizeEventProjectStatus,
  normalizeEventProjectStatus,
  type EventProjectStatus,
} from "@/lib/project-lifecycle";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

type SearchParams = {
  stage?: string;
};

type SalesProjectRow = {
  id: string;
  client_id: string | null;
  inquiry_id: string | null;
  project_name: string;
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
  guest_count: number | null;
  investment_range: string | null;
  status: string | null;
  next_action: string | null;
  next_action_due_at: string | null;
  contract_status: string | null;
  payment_status: string | null;
  updated_at: string | null;
};

type ClientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type DocumentRow = {
  id: string;
  inquiry_id: string | null;
  event_project_id: string | null;
  document_type: "quote" | "invoice" | "receipt";
  status: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  created_at: string | null;
};

type ContractRow = {
  id: string;
  inquiry_id: string | null;
  event_project_id: string | null;
  contract_status: string | null;
  contract_total: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean | null;
  balance_due: number | null;
  balance_due_date: string | null;
  signed_at: string | null;
};

type TaskRow = {
  id: string;
  inquiry_id: string | null;
  event_project_id: string | null;
  title: string;
  status: string | null;
  due_at: string | null;
};

type StageDefinition = {
  key: string;
  label: string;
  description: string;
};

const SALES_STAGES: StageDefinition[] = [
  { key: "new_inquiry", label: "New Inquiry", description: "Needs first review" },
  { key: "contacted", label: "Contacted", description: "First touch made" },
  { key: "consultation_scheduled", label: "Consultation Scheduled", description: "Meeting booked" },
  { key: "consultation_completed", label: "Consultation Completed", description: "Ready for scope" },
  { key: "quote_needed", label: "Quote Needed", description: "Build proposal" },
  { key: "quote_sent", label: "Quote Sent", description: "Awaiting decision" },
  { key: "contract_sent", label: "Contract Sent", description: "Agreement pending" },
  { key: "contract_signed", label: "Contract Signed", description: "Deposit next" },
  { key: "deposit_pending", label: "Deposit Pending", description: "Collect deposit" },
  { key: "deposit_paid", label: "Deposit Paid", description: "Booking secured" },
  { key: "event_confirmed", label: "Event Confirmed", description: "Prepare event" },
  { key: "final_payment_pending", label: "Final Payment Pending", description: "Collect balance" },
  { key: "completed", label: "Completed", description: "Event closed" },
  { key: "lost_cancelled", label: "Lost / Cancelled", description: "Closed out" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function customerName(client: ClientRow | null | undefined, fallback: string) {
  const name = [client?.first_name, client?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback.split("·").at(1)?.trim() || fallback;
}

function isOverdue(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function latestByDate<T extends { created_at: string | null }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )[0] ?? null;
}

function deriveSalesStage(input: {
  project: SalesProjectRow;
  quote: DocumentRow | null;
  invoice: DocumentRow | null;
  contract: ContractRow | null;
}) {
  const status = normalizeEventProjectStatus(input.project.status);

  if (status === "archived" || status === "lost_cancelled") return "lost_cancelled";
  if (status === "completed") return "completed";
  if (status === "final_payment_due") return "final_payment_pending";
  if (status === "final_payment_paid" || status === "planning_in_progress" || status === "event_reserved") {
    return "event_confirmed";
  }
  if (status === "deposit_paid") return "deposit_paid";
  if (status === "contract_signed" && !input.contract?.deposit_paid) return "deposit_pending";
  if (status === "contract_signed") return "contract_signed";
  if (status === "contract_sent") return "contract_sent";
  if (status === "quote_accepted") return "contract_sent";
  if (status === "quote_sent") return "quote_sent";
  if (status === "quote_drafted") return input.quote?.status === "sent" ? "quote_sent" : "quote_needed";
  if (status === "consultation_completed") return input.quote ? "consultation_completed" : "quote_needed";
  if (status === "consultation_scheduled") return "consultation_scheduled";
  if (status === "contacted") return "contacted";
  return "new_inquiry";
}

function recommendAction(input: {
  stage: string;
  project: SalesProjectRow;
  quote: DocumentRow | null;
  invoice: DocumentRow | null;
  contract: ContractRow | null;
}) {
  const inquiryId = input.project.inquiry_id;
  const contractId = input.contract?.id ?? null;

  if (input.stage === "quote_needed") {
    return {
      label: input.quote ? "Open Quote Draft" : "Create Quote",
      href: input.quote ? buildDocumentDetailHref(input.quote.id) : buildQuoteCreateHref({ inquiryId }),
    };
  }

  if (input.stage === "quote_sent") {
    return {
      label: "Follow Up Quote",
      href: input.quote ? buildDocumentDetailHref(input.quote.id) : buildDocumentsLibraryHref(),
    };
  }

  if (["contract_sent", "contract_signed", "deposit_pending"].includes(input.stage)) {
    return {
      label: input.contract ? "Open Contract" : "Create Invoice",
      href: input.contract ? `/admin/contracts/${input.contract.id}` : buildInvoiceCreateHref({ inquiryId, contractId }),
    };
  }

  if (["deposit_paid", "event_confirmed", "final_payment_pending"].includes(input.stage)) {
    return {
      label: input.invoice ? "Record Payment" : "Create Invoice",
      href: input.invoice
        ? buildDocumentDetailHref(input.invoice.id, { openPayment: true, paymentMethod: "cash" })
        : buildInvoiceCreateHref({ inquiryId, contractId }),
    };
  }

  return {
    label: "Open Project",
    href: buildEventProjectDetailHref(input.project.id),
  };
}

export default async function AdminSalesPipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage("sales");
  const params = await searchParams;
  const activeStage = params.stage || "all";

  const { data: projects, error: projectsError } = await supabaseAdmin
    .from("event_projects")
    .select(
      "id, client_id, inquiry_id, project_name, event_type, event_date, venue_name, guest_count, investment_range, status, next_action, next_action_due_at, contract_status, payment_status, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(250);

  if (projectsError) {
    return (
      <main className="admin-page section admin-page--workspace">
        <header className="admin-page-header admin-page-header--reference">
          <div>
            <h1>Sales Pipeline</h1>
            <p>Lifecycle, contracts, deposits, invoices, and next actions in one operating view.</p>
          </div>
        </header>
        <section className="card admin-section-card">
          <p className="error">
            Sales Pipeline requires the `event_projects` migration. Apply `supabase.event-projects.sql`, then reload this page.
          </p>
        </section>
      </main>
    );
  }

  const projectRows = (projects ?? []) as SalesProjectRow[];
  const projectIds = projectRows.map((project) => project.id);
  const inquiryIds = projectRows.map((project) => project.inquiry_id).filter((id): id is string => Boolean(id));
  const clientIds = projectRows.map((project) => project.client_id).filter((id): id is string => Boolean(id));

  const [clientsResult, documentsResult, contractsResult, tasksResult] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("clients").select("id, first_name, last_name, email, phone").in("id", clientIds)
      : Promise.resolve({ data: [] as ClientRow[], error: null }),
    projectIds.length || inquiryIds.length
      ? supabaseAdmin
          .from("client_documents")
          .select("id, inquiry_id, event_project_id, document_type, status, total_amount, amount_paid, balance_due, created_at")
          .or(
            [
              projectIds.length ? `event_project_id.in.(${projectIds.join(",")})` : null,
              inquiryIds.length ? `inquiry_id.in.(${inquiryIds.join(",")})` : null,
            ].filter(Boolean).join(",")
          )
      : Promise.resolve({ data: [] as DocumentRow[], error: null }),
    projectIds.length || inquiryIds.length
      ? supabaseAdmin
          .from("contracts")
          .select("id, inquiry_id, event_project_id, contract_status, contract_total, deposit_amount, deposit_paid, balance_due, balance_due_date, signed_at")
          .or(
            [
              projectIds.length ? `event_project_id.in.(${projectIds.join(",")})` : null,
              inquiryIds.length ? `inquiry_id.in.(${inquiryIds.join(",")})` : null,
            ].filter(Boolean).join(",")
          )
      : Promise.resolve({ data: [] as ContractRow[], error: null }),
    projectIds.length || inquiryIds.length
      ? supabaseAdmin
          .from("crm_follow_up_tasks")
          .select("id, inquiry_id, event_project_id, title, status, due_at")
          .eq("status", "open")
          .or(
            [
              projectIds.length ? `event_project_id.in.(${projectIds.join(",")})` : null,
              inquiryIds.length ? `inquiry_id.in.(${inquiryIds.join(",")})` : null,
            ].filter(Boolean).join(",")
          )
      : Promise.resolve({ data: [] as TaskRow[], error: null }),
  ]);

  if (clientsResult.error || documentsResult.error || contractsResult.error || tasksResult.error) {
    throw new Error(
      clientsResult.error?.message ||
        documentsResult.error?.message ||
        contractsResult.error?.message ||
        tasksResult.error?.message ||
        "Sales pipeline data failed to load"
    );
  }

  const clientsById = new Map(((clientsResult.data ?? []) as ClientRow[]).map((client) => [client.id, client]));
  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const contracts = (contractsResult.data ?? []) as ContractRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];

  const rows = projectRows.map((project) => {
    const linkedDocuments = documents.filter(
      (document) =>
        document.event_project_id === project.id ||
        (project.inquiry_id && document.inquiry_id === project.inquiry_id)
    );
    const quote = latestByDate(linkedDocuments.filter((document) => document.document_type === "quote"));
    const invoice = latestByDate(linkedDocuments.filter((document) => document.document_type === "invoice"));
    const receipt = latestByDate(linkedDocuments.filter((document) => document.document_type === "receipt"));
    const contract =
      contracts.find(
        (item) =>
          item.event_project_id === project.id ||
          (project.inquiry_id && item.inquiry_id === project.inquiry_id)
      ) ?? null;
    const task =
      tasks
        .filter(
          (item) =>
            item.event_project_id === project.id ||
            (project.inquiry_id && item.inquiry_id === project.inquiry_id)
        )
        .sort((a, b) => new Date(a.due_at ?? 0).getTime() - new Date(b.due_at ?? 0).getTime())[0] ?? null;
    const stage = deriveSalesStage({ project, quote, invoice, contract });
    const action = recommendAction({ stage, project, quote, invoice, contract });
    const client = project.client_id ? clientsById.get(project.client_id) ?? null : null;
    const openBalance = Number(invoice?.balance_due ?? contract?.balance_due ?? 0);
    const estimatedValue = Number(invoice?.total_amount ?? contract?.contract_total ?? quote?.total_amount ?? 0);

    return {
      project,
      client,
      quote,
      invoice,
      receipt,
      contract,
      task,
      stage,
      action,
      openBalance,
      estimatedValue,
    };
  });

  const visibleRows = rows.filter((row) => activeStage === "all" || row.stage === activeStage);
  const stageCounts = new Map(SALES_STAGES.map((stage) => [stage.key, 0]));
  for (const row of rows) {
    stageCounts.set(row.stage, (stageCounts.get(row.stage) ?? 0) + 1);
  }

  const urgentRows = rows.filter(
    (row) =>
      isOverdue(row.project.next_action_due_at) ||
      isOverdue(row.task?.due_at) ||
      row.stage === "deposit_pending" ||
      row.stage === "final_payment_pending"
  );
  const totalOpenBalance = rows.reduce((sum, row) => sum + row.openBalance, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.estimatedValue, 0);

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>Sales Pipeline</h1>
          <p>Move each customer from inquiry to quote, contract, deposit, final payment, and completion without hunting through separate modules.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildQuoteCreateHref()} className="admin-head-pill">Create Quote</Link>
          <Link href={buildInvoiceCreateHref()} className="admin-head-pill">Create Invoice</Link>
          <Link href="/admin/contracts" className="admin-head-pill">Contracts</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Sales Pipeline is the operating layer above documents and contracts. Quotes, invoices, receipts, contracts, and payments stay in their own queues, but this page shows which customer needs which action next.
        </p>
      </section>

      <section className="admin-sales-kpi-grid">
        <Link href={buildSalesPipelineHref()} className="card admin-sales-kpi-card">
          <span>Active sales records</span>
          <strong>{rows.length}</strong>
          <p>All customer projects in the sales lifecycle</p>
        </Link>
        <Link href={buildSalesPipelineHref({ stage: "quote_needed" })} className="card admin-sales-kpi-card">
          <span>Quotes needed</span>
          <strong>{stageCounts.get("quote_needed") ?? 0}</strong>
          <p>Consulted or drafted opportunities needing proposal work</p>
        </Link>
        <Link href={buildSalesPipelineHref({ stage: "deposit_pending" })} className="card admin-sales-kpi-card">
          <span>Deposits pending</span>
          <strong>{stageCounts.get("deposit_pending") ?? 0}</strong>
          <p>Signed or contract-stage work waiting on deposit</p>
        </Link>
        <Link href={buildSalesPipelineHref({ stage: "final_payment_pending" })} className="card admin-sales-kpi-card">
          <span>Final payments pending</span>
          <strong>{stageCounts.get("final_payment_pending") ?? 0}</strong>
          <p>{formatMoney(totalOpenBalance)} open balance tracked</p>
        </Link>
        <Link href={buildSalesPipelineHref()} className="card admin-sales-kpi-card">
          <span>Pipeline value</span>
          <strong>{formatMoney(totalValue)}</strong>
          <p>Quote, contract, and invoice value visible here</p>
        </Link>
        <Link href={buildSalesPipelineHref()} className="card admin-sales-kpi-card">
          <span>Urgent actions</span>
          <strong>{urgentRows.length}</strong>
          <p>Overdue follow-ups, deposits, and balances</p>
        </Link>
      </section>

      <section className="card admin-section-card admin-panel admin-panel--wide">
        <AdminSectionHeader
          eyebrow="Sales stages"
          title="Lifecycle filters"
          description="Use these chips as the shared Sales vocabulary. Each stage filters the records below."
        />
        <div className="admin-sales-stage-strip">
          <Link href={buildSalesPipelineHref()} className={`admin-documents-chip${activeStage === "all" ? " is-active" : ""}`}>
            All
            <span>{rows.length}</span>
          </Link>
          {SALES_STAGES.map((stage) => (
            <Link
              key={stage.key}
              href={buildSalesPipelineHref({ stage: stage.key })}
              className={`admin-documents-chip${activeStage === stage.key ? " is-active" : ""}`}
            >
              {stage.label}
              <span>{stageCounts.get(stage.key) ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card admin-section-card admin-panel admin-panel--wide">
        <AdminSectionHeader
          eyebrow="Action queue"
          title={activeStage === "all" ? "Customer sales activity" : `${SALES_STAGES.find((stage) => stage.key === activeStage)?.label ?? activeStage} records`}
          description="Each row shows status, next action, due date, payment state, contract state, event readiness, and the fastest next click."
        />

        <div className="admin-record-table-shell">
          <table className="admin-records-table admin-sales-pipeline-table">
            <thead>
              <tr>
                <th>Customer / Event</th>
                <th>Stage</th>
                <th>Next Action</th>
                <th>Contract</th>
                <th>Payment</th>
                <th>Value</th>
                <th>Event Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row) => {
                  const stageLabel = SALES_STAGES.find((stage) => stage.key === row.stage)?.label ?? humanizeEventProjectStatus(row.project.status);
                  const dueAt = row.project.next_action_due_at ?? row.task?.due_at ?? null;
                  const overdue = isOverdue(dueAt);
                  const clientLabel = customerName(row.client, row.project.project_name);
                  const customerHref = row.client?.id ? buildCrmCustomerDetailHref(row.client.id) : buildEventProjectDetailHref(row.project.id);

                  return (
                    <tr key={row.project.id}>
                      <td>
                        <div className="admin-record-main">
                          <Link href={customerHref}>{clientLabel}</Link>
                          <span>
                            {row.project.event_type || "Event"} · {row.project.guest_count ?? "No"} guests · {row.project.venue_name || "Venue not set"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge status-badge--neutral">{stageLabel}</span>
                        <small>{EVENT_PROJECT_STATUS_LABELS[normalizeEventProjectStatus(row.project.status) as EventProjectStatus] ?? humanizeEventProjectStatus(row.project.status)}</small>
                      </td>
                      <td>
                        <strong>{row.project.next_action || row.task?.title || row.action.label}</strong>
                        <span className={overdue ? "admin-sales-overdue" : ""}>
                          {dueAt ? `${overdue ? "Overdue" : "Due"} ${formatDate(dueAt)}` : "No due date"}
                        </span>
                      </td>
                      <td>
                        <strong>{row.contract?.contract_status || row.project.contract_status || "Not created"}</strong>
                        <span>{row.contract?.deposit_paid ? "Deposit paid" : row.contract ? "Deposit pending" : "Create after quote acceptance"}</span>
                      </td>
                      <td>
                        <strong>{row.invoice?.status || row.project.payment_status || "Not requested"}</strong>
                        <span>{row.openBalance > 0 ? `${formatMoney(row.openBalance)} balance` : row.receipt ? "Receipt exists" : "No open balance"}</span>
                      </td>
                      <td>
                        <strong>{formatMoney(row.estimatedValue)}</strong>
                        <span>{row.project.investment_range || "Range not set"}</span>
                      </td>
                      <td>{formatDate(row.project.event_date)}</td>
                      <td>
                        <div className="admin-sales-row-actions">
                          <Link href={row.action.href} className="admin-table-text-action admin-table-text-action--primary">
                            {row.action.label}
                          </Link>
                          <Link href={buildEventProjectDetailHref(row.project.id)} className="admin-table-text-action">
                            Open Project
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="admin-records-empty">
                    No records match this sales stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
