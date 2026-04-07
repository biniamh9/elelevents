import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewBase from "@/components/forms/admin/document-preview-base";

export default function QuotePreview({
  document,
}: {
  document: ClientDocumentWithRelations;
}) {
  return (
    <DocumentPreviewBase
      document={document}
      lineItems={document.line_items}
      payments={document.payments}
      primaryHeading="Quote / Proposal"
      primaryMessage="A refined proposal for your review, scope confirmation, and approval."
      actionCopy={
        <div className="document-preview-cta-group">
          <span className="summary-chip">Accept Quote</span>
          <span className="summary-chip">Request Changes</span>
        </div>
      }
    />
  );
}
