import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ContractStatusBadge from "@/components/forms/admin/contract-status-badge";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
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

  const { count: sentDocusignCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("docusign_envelope_status", "sent");

  return (
    <main className="section admin-page">
      <div className="admin-dashboard-hero">
        <div className="card admin-hero-card">
          <p className="eyebrow">Contracts Dashboard</p>
          <h1>Contracts</h1>
          <p className="lead">
            Track draft agreements, sent envelopes, signed contracts, and deposit progress.
          </p>
          <div className="summary-pills">
            <span className="summary-chip">Total contracts: {totalContracts ?? 0}</span>
            <span className="summary-chip">Signed: {signedCount ?? 0}</span>
            <span className="summary-chip">Deposit paid: {depositPaidCount ?? 0}</span>
          </div>
        </div>

        <div className="card admin-focus-card">
          <p className="eyebrow">Current Focus</p>
          <div className="admin-mini-metrics">
            <div>
              <strong>{draftCount ?? 0}</strong>
              <span>Drafts to finish</span>
            </div>
            <div>
              <strong>{sentCount ?? 0}</strong>
              <span>Waiting for signature</span>
            </div>
            <div>
              <strong>{sentDocusignCount ?? 0}</strong>
              <span>DocuSign envelopes sent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="card metric-card">
          <p className="muted">Total Contracts</p>
          <strong>{totalContracts ?? 0}</strong>
        </div>

        <div className="card metric-card">
          <p className="muted">Draft</p>
          <strong>{draftCount ?? 0}</strong>
        </div>

        <div className="card metric-card metric-card--blue">
          <p className="muted">Sent</p>
          <strong>{sentCount ?? 0}</strong>
        </div>

        <div className="card metric-card metric-card--violet">
          <p className="muted">Signed</p>
          <strong>{signedCount ?? 0}</strong>
        </div>

        <div className="card metric-card metric-card--green">
          <p className="muted">Deposit Paid</p>
          <strong>{depositPaidCount ?? 0}</strong>
        </div>
      </div>

      {error ? <p className="error">Failed to load contracts: {error.message}</p> : null}

      <div className="card admin-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Contract Table</p>
            <h3>All contracts</h3>
          </div>
        </div>

      <div className="table-wrap">
        <table>
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
            {data?.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleDateString()}</td>
                <td>
                  <Link
                    href={`/admin/contracts/${row.id}`}
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
      </div>
    </main>
  );
}
