import { supabaseAdmin } from "@/lib/supabase/admin-client";
import DocumentsList from "@/components/forms/admin/documents-list";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { data: documents, error } = await supabaseAdmin
    .from("client_documents")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: totalCount } = await supabaseAdmin
    .from("client_documents")
    .select("*", { count: "exact", head: true });
  const { count: quoteCount } = await supabaseAdmin
    .from("client_documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", "quote");
  const { count: invoiceCount } = await supabaseAdmin
    .from("client_documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", "invoice");
  const { count: receiptCount } = await supabaseAdmin
    .from("client_documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", "receipt");

  return (
    <main className="section admin-page">
      <div className="admin-dashboard-hero">
        <div className="card admin-hero-card">
          <p className="eyebrow">Document system</p>
          <h1>Client documents</h1>
          <p className="lead">
            Create polished quotes, invoices, and receipts with one luxury-branded workflow.
          </p>
        </div>

        <div className="card admin-focus-card">
          <p className="eyebrow">Current Focus</p>
          <div className="admin-mini-metrics">
            <div>
              <strong>{quoteCount ?? 0}</strong>
              <span>Quotes</span>
            </div>
            <div>
              <strong>{invoiceCount ?? 0}</strong>
              <span>Invoices</span>
            </div>
            <div>
              <strong>{receiptCount ?? 0}</strong>
              <span>Receipts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="card metric-card">
          <p className="muted">Total documents</p>
          <strong>{totalCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--violet">
          <p className="muted">Quotes</p>
          <strong>{quoteCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--amber">
          <p className="muted">Invoices</p>
          <strong>{invoiceCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--green">
          <p className="muted">Receipts</p>
          <strong>{receiptCount ?? 0}</strong>
        </div>
      </div>

      {error ? (
        <div className="card">
          <p className="error">
            Failed to load documents. Apply the new `supabase.client-documents.sql` schema first.
          </p>
        </div>
      ) : (
        <DocumentsList documents={documents ?? []} />
      )}
    </main>
  );
}
