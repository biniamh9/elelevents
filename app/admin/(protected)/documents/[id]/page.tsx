import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentById } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";
import AdminPageIntro from "@/components/admin/admin-page-intro";
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
      <AdminPageIntro
        title={document.document_number}
        description="Edit the record details here, then open the standalone document output to print or save the final client-facing PDF."
      />
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link href={buildDocumentsLibraryHref()} className="admin-topbar-pill">
          Back to Documents
        </Link>
        <Link
          href={buildDocumentPdfHref(document.id)}
          className="admin-topbar-pill"
          target="_blank"
          rel="noreferrer"
        >
          Open PDF
        </Link>
        <Link
          href={buildDocumentPdfHref(document.id, { download: true, compact: true })}
          className="admin-topbar-pill"
          target="_blank"
          rel="noreferrer"
        >
          Download PDF
        </Link>
      </div>

      <DocumentEditor
        initialDocument={document}
        mode="edit"
        initialShowPaymentForm={query.openPayment === "1"}
        initialPaymentMethod={query.paymentMethod || "bank_transfer"}
      />
    </main>
  );
}
