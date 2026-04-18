import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentById } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <main className="section admin-page admin-page--workspace">
      <div className="admin-page-header">
        <div>
          <h1>{document.document_number}</h1>
          <p>
            Keep the client-facing document, totals, and preview aligned in one editor.
          </p>
        </div>
      </div>
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link href="/admin/documents" className="admin-topbar-pill">
          Back to Documents
        </Link>
      </div>

      <DocumentEditor initialDocument={document} mode="edit" />
    </main>
  );
}
