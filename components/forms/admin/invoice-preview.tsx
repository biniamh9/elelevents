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
      documentLabel="Invoice"
      emphasisLabel="Payment due"
      primaryHeading="Invoice for your confirmed event scope."
      primaryMessage="This invoice outlines the approved scope, current charges, and the amount due to keep production and event scheduling on track."
      totalLabel="Total due"
      balanceLabel="Remaining balance"
      footerMessage="Please reference the invoice number with your payment and contact Elel Events & Design if you need any billing clarification."
    />
  );
}
