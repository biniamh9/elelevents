import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentById } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("sales");

  const { id } = await params;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <main className="section admin-page admin-page--workspace">
      <AdminPageIntro
        title={document.document_number}
        description="Keep the client-facing document, totals, and preview aligned in one editor."
      />
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link href="/admin/documents" className="admin-topbar-pill">
          Back to Documents
        </Link>
      </div>

      <DocumentEditor initialDocument={document} mode="edit" />
    </main>
  );
}
