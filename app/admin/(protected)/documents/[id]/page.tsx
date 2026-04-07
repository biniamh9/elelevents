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
    <main className="section admin-page">
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/documents" className="btn secondary">
          ← Back to Documents
        </Link>
      </div>
      <div className="section-heading">
        <p className="eyebrow">Document workspace</p>
        <h1>{document.document_number}</h1>
        <p className="lead">
          Keep the client-facing document, totals, and preview aligned in one editor.
        </p>
      </div>

      <DocumentEditor initialDocument={document} mode="edit" />
    </main>
  );
}
