import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewBase from "@/components/forms/admin/document-preview-base";

export default function InvoicePreview({
  document,
}: {
  document: ClientDocumentWithRelations;
}) {
  return (
    <DocumentPreviewBase
      document={document}
      lineItems={document.line_items}
      payments={document.payments}
      primaryHeading="Invoice"
      primaryMessage="A formal payment document with clear due date, balance, and payment instructions."
    />
  );
}
