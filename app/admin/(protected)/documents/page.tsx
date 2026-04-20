import { supabaseAdmin } from "@/lib/supabase/admin-client";
import DocumentsList from "@/components/forms/admin/documents-list";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireAdminPage("sales");

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
      <AdminPageIntro
        title="Client documents"
        description="Keep quotes, invoices, and receipts in one polished workflow so client-facing financial communication stays clear and consistent."
      />

      <AdminMetricStrip
        items={[
          { label: "Total documents", value: totalCount ?? 0, note: "All quotes, invoices, and receipts" },
          { label: "Quotes", value: quoteCount ?? 0, note: "Proposal-stage client documents", tone: "violet" },
          { label: "Invoices", value: invoiceCount ?? 0, note: "Payment requests in progress", tone: "amber" },
          { label: "Receipts", value: receiptCount ?? 0, note: "Confirmed client payments", tone: "green" },
        ]}
      />

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
