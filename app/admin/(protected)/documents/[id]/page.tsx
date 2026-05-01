import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentById } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";
import {
  buildDocumentPdfHref,
  buildDocumentOutputHref,
  buildDocumentsLibraryHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ openPayment?: string; paymentMethod?: string }>;
}) {
  await requireAdminPage("sales");

  const { id } = await params;
  const query = await searchParams;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <main className="section admin-page admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{document.document_number}</h1>
          <p>Edit the record details here, then open the standalone document output to print or save the final client-facing PDF.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildDocumentPdfHref(document.id)} className="admin-head-pill" target="_blank" rel="noreferrer">
            Open PDF
          </Link>
          <Link
            href={buildDocumentPdfHref(document.id, { download: true, compact: true })}
            className="admin-head-pill"
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep the editable document record and the final client-facing output in one structured workflow so edits, print output, and PDF delivery stay aligned
        </p>
      </section>

      <section className="card admin-table-card admin-management-card admin-reference-records-shell">
        <div className="admin-reference-filter-group">
          <p>Document actions</p>
          <div className="admin-documents-chip-row">
            <Link href={buildDocumentsLibraryHref()} className="admin-documents-chip">
              Back to documents
            </Link>
            <Link
              href={buildDocumentOutputHref(document.id)}
              className="admin-documents-chip"
              target="_blank"
              rel="noreferrer"
            >
              Open output view
            </Link>
            <Link
              href={buildDocumentOutputHref(document.id, {
                autoprint: true,
                intent: "print",
                compact: true,
              })}
              className="admin-documents-chip"
              target="_blank"
              rel="noreferrer"
            >
              Print compact
            </Link>
          </div>
        </div>
      </section>

      <DocumentEditor
        initialDocument={document}
        mode="edit"
        initialShowPaymentForm={query.openPayment === "1"}
        initialPaymentMethod={query.paymentMethod || "bank_transfer"}
      />
    </main>
  );
}
