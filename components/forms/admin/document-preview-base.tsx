import {
  formatDocumentDate,
  formatMoney,
  type ClientDocumentLineItem,
  type ClientDocumentPayment,
  type ClientDocumentRecord,
} from "@/lib/client-documents";
import DocumentStatusBadge from "@/components/forms/admin/document-status-badge";

function buildBillingSummaryRows(document: ClientDocumentRecord) {
  return [
    { label: "Included", value: document.inclusions },
    { label: "Exclusions", value: document.exclusions },
    { label: "Payment instructions", value: document.payment_instructions },
    { label: "Terms", value: document.payment_terms },
    { label: "Notes", value: document.notes },
  ].filter((entry) => entry.value);
}

function PreviewTable({
  lineItems,
  compact = false,
}: {
  lineItems: ClientDocumentLineItem[];
  compact?: boolean;
}) {
  return (
    <table
      className={`document-preview-table${compact ? " document-preview-table--compact" : ""}`}
    >
      <colgroup>
        <col className="document-preview-table-col-item" />
        <col className="document-preview-table-col-details" />
        <col className="document-preview-table-col-qty" />
        <col className="document-preview-table-col-unit" />
        <col className="document-preview-table-col-total" />
      </colgroup>
      <thead>
        <tr>
          <th>Item</th>
          <th>Details</th>
          <th className="document-preview-table-number">Qty</th>
          <th className="document-preview-table-number">Unit</th>
          <th className="document-preview-table-number">Total</th>
        </tr>
      </thead>
      <tbody>
        {lineItems.map((item) => (
          <tr key={item.id}>
            <td>
              <strong>{item.title}</strong>
            </td>
            <td>{item.description || "—"}</td>
            <td className="document-preview-table-number">{item.quantity}</td>
            <td className="document-preview-table-number">${formatMoney(item.unit_price)}</td>
            <td className="document-preview-table-number">${formatMoney(item.total_price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DocumentPreviewBase({
  document,
  lineItems,
  payments,
  primaryHeading,
  primaryMessage,
  documentLabel,
  emphasisLabel,
  footerMessage,
  totalLabel = "Total",
  balanceLabel = "Balance due",
  showDeposit = true,
  actionCopy,
  density = "editorial",
}: {
  document: ClientDocumentRecord;
  lineItems: ClientDocumentLineItem[];
  payments?: ClientDocumentPayment[];
  primaryHeading: string;
  primaryMessage: string;
  documentLabel: string;
  emphasisLabel: string;
  footerMessage: string;
  totalLabel?: string;
  balanceLabel?: string;
  showDeposit?: boolean;
  actionCopy?: React.ReactNode;
  density?: "editorial" | "compact";
}) {
  const compact = density === "compact";
  const receiptCompact = compact && document.document_type === "receipt";
  const billingSummaryRows = compact ? buildBillingSummaryRows(document) : [];

  return (
    <section
      className={`document-preview-page document-preview-page--${document.document_type}${
        compact ? " document-preview-page--compact" : ""
      }`}
    >
      <header className="document-preview-header">
        <div className="document-preview-brand-block">
          <p className="eyebrow">Elel Events & Design</p>
          <span className="document-preview-label">{documentLabel}</span>
          <p className="muted">{primaryMessage}</p>
          <h2>{primaryHeading}</h2>
        </div>
        <div className="document-preview-meta-card">
          <DocumentStatusBadge status={document.status} />
          <p className="document-preview-meta-eyebrow">{emphasisLabel}</p>
          <div className="document-preview-meta-list">
            <div><span>Reference</span><strong>#{document.document_number}</strong></div>
            <div><span>Issued</span><strong>{formatDocumentDate(document.issue_date)}</strong></div>
            {document.due_date ? (
              <div><span>Due</span><strong>{formatDocumentDate(document.due_date)}</strong></div>
            ) : null}
          </div>
          {document.expiration_date ? (
            <div className="document-preview-meta-list">
              <div><span>Expires</span><strong>{formatDocumentDate(document.expiration_date)}</strong></div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="document-preview-info-grid">
        <div className="document-preview-info-card">
          <p className="eyebrow">Client</p>
          <strong>{document.customer_name}</strong>
          <p>{document.customer_email || "—"}</p>
          <p>{document.customer_phone || "—"}</p>
        </div>
        <div className="document-preview-info-card">
          <p className="eyebrow">Event</p>
          <strong>{receiptCompact ? "Payment record" : document.event_type || "Event"}</strong>
          <p>{formatDocumentDate(document.event_date)}</p>
          {!receiptCompact ? (
            <p>{document.venue_name || "Venue to be confirmed"}</p>
          ) : null}
          {!receiptCompact && document.venue_address ? <p>{document.venue_address}</p> : null}
        </div>
      </div>

      <div className="document-preview-sheet">
        <PreviewTable lineItems={lineItems} compact={compact} />

        <div className="document-preview-totals">
          <div><span>Subtotal</span><strong>${formatMoney(document.subtotal)}</strong></div>
          {document.delivery_fee > 0 ? (
            <div><span>Delivery fee</span><strong>${formatMoney(document.delivery_fee)}</strong></div>
          ) : null}
          {document.setup_fee > 0 ? (
            <div><span>Setup fee</span><strong>${formatMoney(document.setup_fee)}</strong></div>
          ) : null}
          {document.discount_amount > 0 ? (
            <div><span>Discount</span><strong>-${formatMoney(document.discount_amount)}</strong></div>
          ) : null}
          {document.tax_amount > 0 ? (
            <div><span>Tax</span><strong>${formatMoney(document.tax_amount)}</strong></div>
          ) : null}
          <div className="document-preview-total-row">
            <span>{totalLabel}</span>
            <strong>${formatMoney(document.total_amount)}</strong>
          </div>
          {showDeposit && document.deposit_required > 0 ? (
            <div><span>Deposit required</span><strong>${formatMoney(document.deposit_required)}</strong></div>
          ) : null}
          {document.amount_paid > 0 ? (
            <div><span>Amount paid</span><strong>${formatMoney(document.amount_paid)}</strong></div>
          ) : null}
          <div><span>{balanceLabel}</span><strong>${formatMoney(document.balance_due)}</strong></div>
        </div>

        <div className="document-preview-notes">
          {compact && billingSummaryRows.length ? (
            <div className="document-preview-billing-summary">
              <p className="eyebrow">Billing summary</p>
              <div className="document-preview-billing-summary-list">
                {billingSummaryRows.map((entry) => (
                  <div key={entry.label} className="document-preview-billing-summary-row">
                    <strong>{entry.label}</strong>
                    <p>{entry.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {!compact && document.inclusions ? (
            <div>
              <p className="eyebrow">What’s included</p>
              <p>{document.inclusions}</p>
            </div>
          ) : null}
          {!compact && document.exclusions ? (
            <div>
              <p className="eyebrow">Exclusions / assumptions</p>
              <p>{document.exclusions}</p>
            </div>
          ) : null}
          {!compact && document.payment_instructions ? (
            <div>
              <p className="eyebrow">Payment instructions</p>
              <p>{document.payment_instructions}</p>
            </div>
          ) : null}
          {!compact && document.payment_terms ? (
            <div>
              <p className="eyebrow">Terms</p>
              <p>{document.payment_terms}</p>
            </div>
          ) : null}
          {!compact && document.notes ? (
            <div>
              <p className="eyebrow">Notes</p>
              <p>{document.notes}</p>
            </div>
          ) : null}
          {payments?.length ? (
            <div>
              <p className="eyebrow">Payments received</p>
              <div className="document-preview-payments">
                {payments.map((payment) => (
                  <div key={payment.id}>
                    <span>{formatDocumentDate(payment.payment_date)}</span>
                    <strong>${formatMoney(payment.amount)}</strong>
                    <p>{payment.payment_method || "Payment recorded"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {actionCopy ? <div className="document-preview-footer-callout">{actionCopy}</div> : null}
      <footer className="document-preview-footer">
        <strong>Elel Events & Design</strong>
        <span>{footerMessage}</span>
      </footer>
    </section>
  );
}
