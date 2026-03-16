import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ContractManagementForm from "@/components/forms/admin/contract-management-form";
import ContractPreview from "@/components/forms/admin/contract-preview";
import ContractStatusBadge from "@/components/forms/admin/contract-status-badge";
import { normalizeContractDetails } from "@/lib/contracts";
export const dynamic = "force-dynamic";

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  const coverageLabel = [
    details.event_coverage.includes_reception ? "Reception" : null,
    details.event_coverage.includes_melsi ? "Melsi" : null,
  ]
    .filter(Boolean)
    .join(" + ");
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
  const warnings = [
    !contract.contract_sent_at ? "Contract has not been sent yet." : null,
    !contract.deposit_amount ? "Deposit amount is missing." : null,
    !contract.balance_due_date ? "Balance due date is missing." : null,
    contract.contract_status === "signed" && !contract.deposit_paid
      ? "Signed, but deposit is still unpaid."
      : null,
    contract.docusign_envelope_id && !contract.docusign_envelope_status
      ? "DocuSign envelope exists, but status has not been synced yet."
      : null,
  ].filter(Boolean);
  const overviewCards = [
    {
      label: "Contract status",
      value: humanizeLabel(contract.contract_status ?? "draft"),
      subtext: contract.contract_sent_at
        ? `Sent ${new Date(contract.contract_sent_at).toLocaleDateString()}`
        : "Not sent yet",
    },
    {
      label: "Signing",
      value: humanizeLabel(contract.docusign_envelope_status ?? "not_sent"),
      subtext: contract.docusign_envelope_id ? "DocuSign linked" : "No envelope yet",
    },
    {
      label: "Deposit",
      value: contract.deposit_paid ? "Paid" : "Outstanding",
      subtext: `$${Number(contract.deposit_amount ?? 0).toLocaleString()}`,
    },
    {
      label: "Balance due",
      value: contract.balance_due_date ?? "Missing",
      subtext: `$${Number(contract.balance_due ?? 0).toLocaleString()}`,
    },
  ];

  return (
    <main className="container section">
      <div className="contract-page-header">
        <div>
          <Link href="/admin/contracts" className="btn secondary">
            ← Back to Contracts
          </Link>
          <p className="eyebrow" style={{ marginTop: "18px" }}>
            Contract workspace
          </p>
          <div className="contract-title-row">
            <h2>{contract.client_name}</h2>
            <ContractStatusBadge status={contract.contract_status ?? "draft"} />
          </div>
          <p className="lead">
            Keep the contract, payment, and signing state in one place without
            forcing the user to scroll through a wall of fields.
          </p>
        </div>
        <div className="contract-header-meta card">
          <p><strong>Event:</strong> {contract.event_type ?? "—"}</p>
          <p><strong>Date:</strong> {contract.event_date ?? "—"}</p>
          <p><strong>Venue:</strong> {contract.venue_name ?? "—"}</p>
          <p><strong>Coverage:</strong> {coverageLabel || "Not defined"}</p>
        </div>
      </div>

      <div className="contract-kpi-grid">
        {overviewCards.map((item) => (
          <div key={item.label} className="card contract-kpi-card">
            <p className="eyebrow">{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.subtext}</span>
          </div>
        ))}
      </div>

      <div className="contract-workspace">
        <aside className="contract-sidebar">
          <div className="crm-hero-card card contract-sticky-card">
            <p className="eyebrow">Core deal</p>
            <h3>{contract.client_name}</h3>
            <p className="muted">
              {contract.event_type ?? "Event"} {contract.event_date ? `• ${contract.event_date}` : ""} {contract.venue_name ? `• ${contract.venue_name}` : ""}
            </p>
            <div className="summary-pills">
              <span className="summary-chip">Status: {contract.contract_status ?? "draft"}</span>
              <span className="summary-chip">Total: ${Number(contract.contract_total ?? 0).toLocaleString()}</span>
              <span className="summary-chip">Balance due: ${Number(contract.balance_due ?? 0).toLocaleString()}</span>
              <span className="summary-chip">DocuSign: {humanizeLabel(contract.docusign_envelope_status ?? "not_sent")}</span>
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
            <p className="eyebrow">Needs attention</p>
            <div className="contract-alert-list">
              {warnings.length ? (
                warnings.map((warning) => (
                  <p key={warning} className="contract-alert-item">
                    {warning}
                  </p>
                ))
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No obvious gaps right now.
                </p>
              )}
            </div>
          </div>

          <div className="card contract-sticky-card">
            <p className="eyebrow">Quick context</p>
            <p><strong>Coverage:</strong> {coverageLabel || "—"}</p>
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
          <div className="card contract-editor-card">
            <h3>Edit Contract</h3>
            <p className="muted">
              Work one section at a time. Save, send, and sync from the same
              workspace without losing the contract basics.
            </p>
            <ContractManagementForm contract={contract} />
          </div>

          <details className="card contract-preview-shell">
            <summary className="contract-preview-toggle">
              <span>Preview agreement draft</span>
              <span className="summary-chip">Before sending</span>
            </summary>
            <div className="contract-preview-body">
              <div className="contract-preview-heading">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h3>Agreement draft</h3>
                </div>
              </div>
              <ContractPreview contract={contract} details={details} />
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
