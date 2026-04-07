import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewBase from "@/components/forms/admin/document-preview-base";

export default function ReceiptPreview({
  document,
}: {
  document: ClientDocumentWithRelations;
}) {
  return (
    <DocumentPreviewBase
      document={document}
      lineItems={document.line_items}
      payments={document.payments}
      primaryHeading="Payment Receipt"
      primaryMessage="Payment confirmed. Keep this receipt for your records and event planning file."
    />
  );
}
