import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import InvoicePreview from "@/components/forms/admin/invoice-preview";
import QuotePreview from "@/components/forms/admin/quote-preview";
import ReceiptPreview from "@/components/forms/admin/receipt-preview";

export default function DocumentPreviewRenderer({
  document,
  printCompact = false,
}: {
  document: ClientDocumentWithRelations;
  printCompact?: boolean;
}) {
  if (document.document_type === "invoice") {
    return <InvoicePreview document={document} printCompact={printCompact} />;
  }

  if (document.document_type === "receipt") {
    return <ReceiptPreview document={document} printCompact={printCompact} />;
  }

  return <QuotePreview document={document} printCompact={printCompact} />;
}
