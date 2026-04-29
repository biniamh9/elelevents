import { notFound } from "next/navigation";
import DocumentOutputView from "@/components/forms/admin/document-output-view";
import { getDocumentById } from "@/lib/admin-documents";
import {
  buildDocumentDetailHref,
  buildDocumentsLibraryHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminDocumentOutputPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string; intent?: string }>;
}) {
  await requireAdminPage("sales");

  const { id } = await params;
  const query = await searchParams;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <DocumentOutputView
      document={document}
      editHref={buildDocumentDetailHref(document.id)}
      indexHref={buildDocumentsLibraryHref()}
      autoprint={query.autoprint === "1"}
      intent={query.intent === "download" ? "download" : query.intent === "print" ? "print" : "view"}
    />
  );
}
