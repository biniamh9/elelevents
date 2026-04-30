import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewBase from "@/components/forms/admin/document-preview-base";

export default function InvoicePreview({
  document,
  printCompact = false,
}: {
  document: ClientDocumentWithRelations;
  printCompact?: boolean;
}) {
  return (
    <DocumentPreviewBase
      document={document}
      lineItems={document.line_items}
      payments={document.payments}
      documentLabel="Invoice"
      emphasisLabel="Payment due"
      primaryHeading="Invoice for your approved event scope."
      primaryMessage="A concise billing summary for the agreed event scope, current charges, and balance due."
      totalLabel="Total due"
      balanceLabel="Remaining balance"
      footerMessage="Please reference the invoice number with your payment and contact Elel Events & Design if you need any billing clarification."
      density="compact"
      printCompact={printCompact}
    />
  );
}
