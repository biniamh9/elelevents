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
      documentLabel="Payment Receipt"
      emphasisLabel="Payment confirmed"
      primaryHeading="Thank you. Your payment has been received."
      primaryMessage="This receipt confirms your payment and keeps your event record clear as we continue planning the final details with you."
      totalLabel="Amount received"
      balanceLabel="Balance remaining"
      showDeposit={false}
      footerMessage="Thank you for trusting Elel Events & Design. Keep this receipt for your records and planning file."
    />
  );
}
