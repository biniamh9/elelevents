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
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Client documents</h1>
          <p className="lead">
            Keep quotes, invoices, and receipts in one polished workflow so client-facing
            financial communication stays clear and consistent.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Documents: {totalCount ?? 0}</span>
          <span className="admin-head-pill">Quotes: {quoteCount ?? 0}</span>
          <span className="admin-head-pill">Invoices: {invoiceCount ?? 0}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <div className="admin-kpi-grid admin-kpi-grid--compact">
            <div className="card metric-card">
              <p className="muted">Total documents</p>
              <strong>{totalCount ?? 0}</strong>
              <span>All quotes, invoices, and receipts</span>
            </div>
            <div className="card metric-card metric-card--violet">
              <p className="muted">Quotes</p>
              <strong>{quoteCount ?? 0}</strong>
              <span>Proposal-stage client documents</span>
            </div>
            <div className="card metric-card metric-card--amber">
              <p className="muted">Invoices</p>
              <strong>{invoiceCount ?? 0}</strong>
              <span>Payment requests in progress</span>
            </div>
            <div className="card metric-card metric-card--green">
              <p className="muted">Receipts</p>
              <strong>{receiptCount ?? 0}</strong>
              <span>Confirmed client payments</span>
            </div>
          </div>

          <aside className="card admin-section-card">
            <div className="admin-section-title">
              <h3>Document system</h3>
              <p className="muted">
                Quotes move into invoices, and invoices into receipts. This page keeps the whole
                client document path in one place.
              </p>
            </div>
            <div className="admin-mini-metrics admin-mini-metrics--plain">
              <div>
                <strong>{quoteCount ?? 0}</strong>
                <span>Quotes ready for client review</span>
              </div>
              <div>
                <strong>{invoiceCount ?? 0}</strong>
                <span>Invoices waiting on payment action</span>
              </div>
              <div>
                <strong>{receiptCount ?? 0}</strong>
                <span>Receipts already recorded</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

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
