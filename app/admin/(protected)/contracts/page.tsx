import Link from "next/link";
import {
  buildContractDetailHref,
  buildContractsWorkspaceHref,
  type ContractQueue,
} from "@/lib/admin-navigation";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ContractStatusBadge from "@/components/forms/admin/contract-status-badge";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  await requireAdminPage("sales");
  const { queue: rawQueue = "all" } = await searchParams;
  const queue = (
    ["all", "draft", "sent", "signed", "unsigned", "deposit_pending"].includes(rawQueue)
      ? rawQueue
      : "all"
  ) as ContractQueue;

  const { data, error } = await supabaseAdmin
    .from("contracts")
    .select("id, client_name, event_type, event_date, contract_total, contract_status, deposit_paid, created_at, docusign_envelope_status")
    .order("created_at", { ascending: false });

  const { count: totalContracts } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true });

  const { count: draftCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("contract_status", "draft");

  const { count: sentCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("contract_status", "sent");

  const { count: signedCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("contract_status", "signed");

  const { count: depositPaidCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("deposit_paid", true);
  const { count: depositPendingCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("deposit_paid", false);

  const { count: sentDocusignCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("docusign_envelope_status", "sent");
  const filteredContracts = (data ?? []).filter((row) => {
    if (queue === "draft") return row.contract_status === "draft";
    if (queue === "sent") return row.contract_status === "sent";
    if (queue === "signed") return row.contract_status === "signed";
    if (queue === "unsigned") return ["draft", "sent"].includes(row.contract_status ?? "draft");
    if (queue === "deposit_pending") return !row.deposit_paid;
    return true;
  });
  const boardStages = [
    {
      key: "draft",
      label: "Draft",
      items: filteredContracts.filter((row) => row.contract_status === "draft"),
    },
    {
      key: "sent",
      label: "Sent",
      items: filteredContracts.filter((row) => row.contract_status === "sent"),
    },
    {
      key: "signed",
      label: "Signed",
      items: filteredContracts.filter((row) => row.contract_status === "signed"),
    },
    {
      key: "deposit_paid",
      label: "Deposit Paid",
      items: filteredContracts.filter((row) => row.deposit_paid),
    },
  ];

  return (
    <main className="section admin-page admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>Contracts</h1>
          <p>Track draft agreements, sent envelopes, signed contracts, and deposit progress.</p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total {totalContracts ?? 0}</span>
          <span className="admin-head-pill">Signed {signedCount ?? 0}</span>
          <span className="admin-head-pill">Deposits paid {depositPaidCount ?? 0}</span>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep agreements, signature state, and deposit confirmation in one structured workflow so booking readiness is visible at a glance
        </p>
      </section>

      <AdminMetricStrip
        items={[
          { label: "Total contracts", value: totalContracts ?? 0 },
          { label: "Draft", value: draftCount ?? 0 },
          { label: "Sent", value: sentCount ?? 0, tone: "blue" },
          { label: "Signed", value: signedCount ?? 0, tone: "violet" },
          { label: "Deposit pending", value: depositPendingCount ?? 0, tone: "amber" },
        ]}
      />

      <section className="card admin-table-card admin-management-card admin-reference-records-shell">
        <div className="admin-reference-filter-group">
          <p>Queue</p>
          <div className="admin-documents-chip-row">
            <Link href={buildContractsWorkspaceHref({ queue: "all" })} className={`admin-documents-chip${queue === "all" ? " is-active" : ""}`}>
              All
            </Link>
            <Link href={buildContractsWorkspaceHref({ queue: "unsigned" })} className={`admin-documents-chip${queue === "unsigned" ? " is-active" : ""}`}>
              Unsigned
            </Link>
            <Link href={buildContractsWorkspaceHref({ queue: "draft" })} className={`admin-documents-chip${queue === "draft" ? " is-active" : ""}`}>
              Draft
            </Link>
            <Link href={buildContractsWorkspaceHref({ queue: "sent" })} className={`admin-documents-chip${queue === "sent" ? " is-active" : ""}`}>
              Sent
            </Link>
            <Link href={buildContractsWorkspaceHref({ queue: "signed" })} className={`admin-documents-chip${queue === "signed" ? " is-active" : ""}`}>
              Signed
            </Link>
            <Link href={buildContractsWorkspaceHref({ queue: "deposit_pending" })} className={`admin-documents-chip${queue === "deposit_pending" ? " is-active" : ""}`}>
              Deposit pending
            </Link>
          </div>
        </div>
      </section>

      <section className="admin-board-shell">
        <AdminSectionHeader
          title="Contract Board"
          description="See which agreements are still moving and which are already secured."
        />
        <div className="admin-kanban-grid">
          {boardStages.map((stage) => (
            <div key={stage.key} className="card admin-kanban-column">
              <div className="admin-kanban-head">
                <div>
                  <p className="eyebrow">{stage.label}</p>
                  <h4>{stage.items.length} contracts</h4>
                </div>
              </div>
              <div className="admin-kanban-list">
                {stage.items.length ? (
                  stage.items.slice(0, 5).map((row) => (
                    <Link
                      key={row.id}
                      href={buildContractDetailHref(row.id)}
                      className="admin-kanban-card"
                    >
                      <strong>{row.client_name}</strong>
                      <span>{row.event_type ?? "Event contract"}</span>
                      <small>
                        {row.event_date ?? "No event date"} · ${row.contract_total ?? 0}
                      </small>
                      <div className="summary-pills">
                        <span className="summary-chip">
                          {humanizeLabel(row.contract_status ?? "draft")}
                        </span>
                        <span className="summary-chip">
                          {humanizeLabel(row.docusign_envelope_status ?? "not_sent")}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No contracts in this stage.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="error">Failed to load contracts: {error.message}</p> : null}

      <div className="card admin-table-card admin-records-table-card admin-reference-records-shell">
        <AdminSectionHeader
          eyebrow="Contract table"
          title="All contracts"
          description="Review agreement status, signature state, event timing, and deposit readiness from one records table."
        />
        <div className="admin-reference-head-pills">
          <span className="admin-reference-head-pill admin-reference-head-pill--strong">
            Showing {filteredContracts.length} contracts
          </span>
          <span className="admin-reference-head-pill">Draft</span>
          <span className="admin-reference-head-pill">{draftCount ?? 0}</span>
          <span className="admin-reference-head-pill">Sent</span>
          <span className="admin-reference-head-pill">{sentCount ?? 0}</span>
          <span className="admin-reference-head-pill">Deposit pending</span>
          <span className="admin-reference-head-pill">{depositPendingCount ?? 0}</span>
        </div>

      <div className="admin-record-table-shell">
        <table className="admin-records-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Client</th>
              <th>Event Type</th>
              <th>Event Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>DocuSign</th>
              <th>Deposit Paid</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleDateString()}</td>
                <td>
                  <Link
                    href={buildContractDetailHref(row.id)}
                    style={{ color: "#a74471", fontWeight: 600 }}
                  >
                    {row.client_name}
                  </Link>
                </td>
                <td>{row.event_type ?? "—"}</td>
                <td>{row.event_date ?? "—"}</td>
                <td>${row.contract_total ?? 0}</td>
                <td>
                  <ContractStatusBadge status={row.contract_status ?? "draft"} />
                </td>
                <td>{row.docusign_envelope_status ?? "—"}</td>
                <td>{row.deposit_paid ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-mobile-records">
        {filteredContracts.map((row) => (
          <Link
            key={row.id}
            href={buildContractDetailHref(row.id)}
            className="admin-mobile-record"
          >
            <div className="admin-mobile-record-head">
              <div>
                <strong>{row.client_name}</strong>
                <span>{row.event_type ?? "Event contract"}</span>
              </div>
              <ContractStatusBadge status={row.contract_status ?? "draft"} />
            </div>

            <div className="admin-mobile-record-grid">
              <p>
                <span>Created</span>
                {new Date(row.created_at).toLocaleDateString()}
              </p>
              <p>
                <span>Event date</span>
                {row.event_date ?? "—"}
              </p>
              <p>
                <span>Total</span>
                ${row.contract_total ?? 0}
              </p>
              <p>
                <span>DocuSign</span>
                {row.docusign_envelope_status ?? "—"}
              </p>
              <p>
                <span>Deposit</span>
                {row.deposit_paid ? "Paid" : "Pending"}
              </p>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </main>
  );
}
