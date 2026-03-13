import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ContractManagementForm from "@/components/forms/admin/contract-management-form";
import ContractPreview from "@/components/forms/admin/contract-preview";
import ContractStatusBadge from "@/components/forms/admin/contract-status-badge";
import { normalizeContractDetails } from "@/lib/contracts";
export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: contract, error } = await supabaseAdmin
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !contract) {
    return (
      <main className="container section">
        <h2>Contract not found</h2>
      </main>
    );
  }

  const scope = contract.scope_json || {};
  const details = normalizeContractDetails(contract.contract_details_json, contract);
  const timeline = [
    {
      label: "Created",
      value: contract.created_at ? new Date(contract.created_at).toLocaleString() : "—",
      tone: "neutral",
    },
    {
      label: "Sent",
      value: contract.contract_sent_at ? new Date(contract.contract_sent_at).toLocaleString() : "Not yet",
      tone: contract.contract_sent_at ? "active" : "muted",
    },
    {
      label: "Signed",
      value: contract.signed_at ? new Date(contract.signed_at).toLocaleString() : "Not yet",
      tone: contract.signed_at ? "active" : "muted",
    },
    {
      label: "Deposit Paid",
      value: contract.deposit_paid_at ? new Date(contract.deposit_paid_at).toLocaleString() : "Not yet",
      tone: contract.deposit_paid_at ? "success" : "muted",
    },
  ];

  return (
    <main className="container section">
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/contracts" className="btn secondary">
          ← Back to Contracts
        </Link>
      </div>

      <h2>Contract CRM View</h2>
      <p className="lead">Manage contract status, payment progress, and the signed-event workflow.</p>

      <div className="contract-workspace">
        <aside className="contract-sidebar">
          <div className="crm-hero-card card contract-sticky-card">
            <p className="eyebrow">Contract summary</p>
            <h3>{contract.client_name}</h3>
            <p className="muted">
              {contract.event_type ?? "Event"} {contract.event_date ? `• ${contract.event_date}` : ""} {contract.venue_name ? `• ${contract.venue_name}` : ""}
            </p>
            <div className="summary-pills">
              <span className="summary-chip">Status: {contract.contract_status ?? "draft"}</span>
              <span className="summary-chip">Total: ${Number(contract.contract_total ?? 0).toLocaleString()}</span>
              <span className="summary-chip">Balance due: ${Number(contract.balance_due ?? 0).toLocaleString()}</span>
              <span className="summary-chip">DocuSign: {contract.docusign_envelope_status ?? "not_sent"}</span>
            </div>

            <div className="contract-meta-list">
              <p><strong>Email:</strong> {contract.client_email ?? "—"}</p>
              <p><strong>Phone:</strong> {contract.client_phone ?? "—"}</p>
              <p><strong>Event date:</strong> {contract.event_date ?? "—"}</p>
              <p><strong>Venue:</strong> {contract.venue_name ?? "—"}</p>
              <p><strong>Guest count:</strong> {details.counts.guest_count ?? contract.guest_count ?? "—"}</p>
              <p><strong>Deposit:</strong> ${contract.deposit_amount ?? 0}</p>
              <p><strong>Balance date:</strong> {contract.balance_due_date ?? "—"}</p>
              <p><strong>Deposit paid:</strong> {contract.deposit_paid ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="crm-timeline card contract-sticky-card">
            <p className="eyebrow">Timeline</p>
            {timeline.map((item) => (
              <div key={item.label} className={`timeline-row ${item.tone}`}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="card contract-sticky-card">
            <p className="eyebrow">Quick Context</p>
            <p><strong>Coverage:</strong> {details.event_coverage.includes_reception ? "Reception" : ""}{details.event_coverage.includes_reception && details.event_coverage.includes_melsi ? " + " : ""}{details.event_coverage.includes_melsi ? "Melsi" : ""}</p>
            <p><strong>Envelope:</strong> {contract.docusign_envelope_id ?? "Not sent yet"}</p>
            <p><strong>Payment method:</strong> {details.payment_record.payment_method ?? "—"}</p>
            <div className="summary-pills">
              {scope.services?.length
                ? scope.services.slice(0, 6).map((service: string) => (
                    <span key={service} className="summary-chip">{service}</span>
                  ))
                : <span className="summary-chip">No scope</span>}
            </div>
          </div>
        </aside>

        <div className="contract-main">
          <div className="card">
            <h3>Contract Actions</h3>
            <p className="muted">
              Work one section at a time. The summary stays visible on the left so you do not lose the core deal information while editing.
            </p>
            <ContractManagementForm contract={contract} />
          </div>

          <details className="card contract-preview-shell">
            <summary className="contract-preview-toggle">
              Preview Agreement Before Sending
            </summary>
            <div style={{ marginTop: "18px" }}>
              <ContractPreview contract={contract} details={details} />
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
