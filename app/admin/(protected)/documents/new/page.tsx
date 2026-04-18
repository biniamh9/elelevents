import Link from "next/link";
import { buildSeedDocument } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";
import type { ClientDocumentType } from "@/lib/client-documents";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    inquiryId?: string;
    contractId?: string;
    sourceDocumentId?: string;
  }>;
}) {
  const params = await searchParams;
  const type = (params.type as ClientDocumentType) || "quote";
  const seeded = await buildSeedDocument({
    type,
    inquiryId: params.inquiryId ?? null,
    contractId: params.contractId ?? null,
    sourceDocumentId: params.sourceDocumentId ?? null,
  });

  return (
    <main className="section admin-page admin-page--workspace">
      <div className="admin-page-header">
        <div>
          <h1>Build a client-ready {type}</h1>
          <p>
            Refine the scope, totals, and notes before sharing anything with the client.
          </p>
        </div>
      </div>
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link href="/admin/documents" className="admin-topbar-pill">
          Back to Documents
        </Link>
      </div>

      <DocumentEditor initialDocument={seeded} mode="create" />
    </main>
  );
}
