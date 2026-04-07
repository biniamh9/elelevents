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
      documentLabel="Quote / Proposal"
      emphasisLabel="Prepared for your review"
      primaryHeading="A refined proposal for your event vision."
      primaryMessage="Review the scope, confirm the styling direction, and let us know what you would like adjusted before we prepare the final booking agreement."
      totalLabel="Proposed total"
      balanceLabel="Estimated balance"
      footerMessage="Your event date is secured once the proposal is approved, the agreement is signed, and the deposit is received."
      actionCopy={
        <div className="document-preview-cta-group">
          <span className="summary-chip">Accept Quote</span>
          <span className="summary-chip">Request Changes</span>
        </div>
      }
    />
  );
}
