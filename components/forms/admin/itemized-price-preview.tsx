import {
  calculateQuoteTotals,
  DEFAULT_ITEMIZED_DISCLAIMER,
  type InquiryQuoteLineItem,
  type InquiryQuotePricing,
} from "@/lib/admin-pricing";

function formatMoney(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ItemizedPricePreview({
  clientName,
  clientEmail,
  eventType,
  eventDate,
  venueName,
  pricing,
  lineItems,
}: {
  clientName: string;
  clientEmail: string | null;
  eventType: string | null;
  eventDate: string | null;
  venueName: string | null;
  pricing: InquiryQuotePricing | null;
  lineItems: InquiryQuoteLineItem[];
}) {
  const totals = calculateQuoteTotals(pricing, lineItems);

  return (
    <section className="card itemized-preview-shell">
      <div className="itemized-preview-head">
        <div>
          <p className="eyebrow">Itemized Price Draft</p>
          <h3>Event estimate</h3>
          <p className="muted">
            Professional draft estimate prepared for review before sharing.
          </p>
        </div>
        <div className="itemized-preview-status">
          <span className="summary-chip">
            Status: {(pricing?.draft_status ?? "internal_draft").replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div className="itemized-preview-meta">
        <div>
          <span>Client</span>
          <strong>{clientName}</strong>
          <p>{clientEmail || "Email not listed"}</p>
        </div>
        <div>
          <span>Event</span>
          <strong>{eventType || "Event"}</strong>
          <p>{eventDate || "Date to be confirmed"}</p>
        </div>
        <div>
          <span>Venue</span>
          <strong>{venueName || "Venue to be confirmed"}</strong>
          <p>Draft prepared for planning review</p>
        </div>
      </div>

      <div className="itemized-preview-table-wrap">
        <table className="itemized-preview-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base event fee</td>
              <td>Flat fee</td>
              <td>1</td>
              <td>${formatMoney(totals.baseFee)}</td>
              <td>${formatMoney(totals.baseFee)}</td>
            </tr>
            {lineItems.length ? (
              lineItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.item_name}</strong>
                    {item.notes ? <p>{item.notes}</p> : null}
                  </td>
                  <td>{item.variant || item.category || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>
                    ${formatMoney(item.unit_price)} / {item.unit_label || "each"}
                  </td>
                  <td>${formatMoney(item.line_total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="itemized-preview-empty">
                  No additional line items yet. This draft currently reflects the base event fee only.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="itemized-preview-summary">
        <div>
          <span>Subtotal</span>
          <strong>${formatMoney(totals.subtotal)}</strong>
        </div>
        {totals.discountAmount > 0 ? (
          <div>
            <span>Discount</span>
            <strong>-${formatMoney(totals.discountAmount)}</strong>
          </div>
        ) : null}
        {totals.deliveryFee > 0 ? (
          <div>
            <span>Delivery / setup</span>
            <strong>${formatMoney(totals.deliveryFee)}</strong>
          </div>
        ) : null}
        {totals.laborAdjustment !== 0 ? (
          <div>
            <span>Labor adjustment</span>
            <strong>${formatMoney(totals.laborAdjustment)}</strong>
          </div>
        ) : null}
        {totals.taxAmount > 0 ? (
          <div>
            <span>Tax</span>
            <strong>${formatMoney(totals.taxAmount)}</strong>
          </div>
        ) : null}
        {totals.manualTotalOverride !== null ? (
          <div>
            <span>Manual total override</span>
            <strong>${formatMoney(totals.manualTotalOverride)}</strong>
          </div>
        ) : null}
        <div className="itemized-preview-grand-total">
          <span>Final total</span>
          <strong>${formatMoney(totals.grandTotal)}</strong>
        </div>
      </div>

      <div className="itemized-preview-disclaimer">
        <strong>Planning note</strong>
        <p>{pricing?.client_disclaimer || DEFAULT_ITEMIZED_DISCLAIMER}</p>
      </div>
    </section>
  );
}
