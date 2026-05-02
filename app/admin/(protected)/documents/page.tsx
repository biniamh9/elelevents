import { supabaseAdmin } from "@/lib/supabase/admin-client";
import DocumentsList from "@/components/forms/admin/documents-list";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  await requireAdminPage("sales");
  const params = await searchParams;

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
    <main className="section admin-page admin-page--workspace">
      <header className="admin-page-header admin-documents-header">
        <h1>Documents</h1>
        <p>Quotes, invoices, and receipts</p>
      </header>

      <section className="admin-documents-summary-shell">
        <p className="admin-documents-summary-lead">
          Keep quotes, invoices, and receipts in one polished workflow as client-facing financial communication stays clear and schedulable
        </p>

        <div className="admin-documents-kpi-grid">
          <article className="card admin-documents-kpi-card">
            <span>Total documents</span>
            <strong>{totalCount ?? 0}</strong>
            <p>All quotes, invoices, and receipts</p>
          </article>
          <article className="card admin-documents-kpi-card">
            <span>Quotes</span>
            <strong>{quoteCount ?? 0}</strong>
            <p>Proposal-stage client documents</p>
          </article>
          <article className="card admin-documents-kpi-card">
            <span>Invoices</span>
            <strong>{invoiceCount ?? 0}</strong>
            <p>Payment requests in progress</p>
          </article>
          <article className="card admin-documents-kpi-card">
            <span>Receipts</span>
            <strong>{receiptCount ?? 0}</strong>
            <p>Confirmed client payments</p>
          </article>
        </div>
      </section>

      {error ? (
        <div className="card">
          <p className="error">
            Failed to load documents. Apply the new `supabase.client-documents.sql` schema first.
          </p>
        </div>
      ) : (
        <DocumentsList
          documents={documents ?? []}
          initialTypeFilter={params.type}
          initialStatusFilter={params.status}
        />
      )}
    </main>
  );
}
