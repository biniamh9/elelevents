import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewBase from "@/components/forms/admin/document-preview-base";

export default function ReceiptPreview({
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
      documentLabel="Payment Receipt"
      emphasisLabel="Payment confirmed"
      primaryHeading="Receipt for your recorded payment."
      primaryMessage="A clean payment confirmation showing the amount received, method, and any remaining balance."
      totalLabel="Amount received"
      balanceLabel="Balance remaining"
      showDeposit={false}
      footerMessage="Thank you for trusting Elel Events & Design. Keep this receipt for your records and planning file."
      density="compact"
      printCompact={printCompact}
    />
  );
}
