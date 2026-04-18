"use client";

import { calculateDocumentTotals, formatMoney, type ClientDocumentLineItem } from "@/lib/client-documents";

export default function PricingSummaryCard({
  lineItems,
  deliveryFee,
  setupFee,
  discountAmount,
  taxAmount,
  amountPaid,
  depositRequired,
  onChange,
}: {
  lineItems: ClientDocumentLineItem[];
  deliveryFee: number;
  setupFee: number;
  discountAmount: number;
  taxAmount: number;
  amountPaid: number;
  depositRequired: number;
  onChange: (
    key:
      | "delivery_fee"
      | "setup_fee"
      | "discount_amount"
      | "tax_amount"
      | "amount_paid"
      | "deposit_required",
    value: number
  ) => void;
}) {
  const totals = calculateDocumentTotals({
    lineItems,
    deliveryFee,
    setupFee,
    discountAmount,
    taxAmount,
    amountPaid,
    depositRequired,
  });

  return (
    <aside className="card admin-document-summary admin-document-summary--pricing">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Pricing Summary</p>
          <h3>Financial overview</h3>
        </div>
      </div>

      <div className="admin-document-summary-fields">
        {[
          ["Delivery fee", "delivery_fee", deliveryFee],
          ["Setup fee", "setup_fee", setupFee],
          ["Discount", "discount_amount", discountAmount],
          ["Tax", "tax_amount", taxAmount],
          ["Deposit required", "deposit_required", depositRequired],
          ["Amount paid", "amount_paid", amountPaid],
        ].map(([label, key, value]) => (
          <div key={String(key)} className="field">
            <label className="label">{label}</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={Number(value)}
              onChange={(event) =>
                onChange(
                  key as
                    | "delivery_fee"
                    | "setup_fee"
                    | "discount_amount"
                    | "tax_amount"
                    | "amount_paid"
                    | "deposit_required",
                  Number(event.target.value || 0)
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="admin-document-summary-list">
        <div>
          <span>Line items</span>
          <strong>${formatMoney(totals.lineItemsSubtotal)}</strong>
        </div>
        <div>
          <span>Subtotal</span>
          <strong>${formatMoney(totals.subtotal)}</strong>
        </div>
        <div>
          <span>Total amount</span>
          <strong>${formatMoney(totals.totalAmount)}</strong>
        </div>
        <div>
          <span>Balance due</span>
          <strong>${formatMoney(totals.balanceDue)}</strong>
        </div>
      </div>
    </aside>
  );
}
