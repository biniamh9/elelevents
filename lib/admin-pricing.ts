export type PricingCatalogItem = {
  id: string;
  name: string;
  category: string | null;
  variant: string | null;
  unit_label: string | null;
  unit_price: number;
  is_active: boolean;
  notes: string | null;
  sort_order: number | null;
};

export type InquiryQuotePricing = {
  inquiry_id: string;
  base_fee: number;
  discount_amount: number;
  delivery_fee: number;
  labor_adjustment: number;
  tax_amount: number;
  manual_total_override: number | null;
  notes: string | null;
  draft_status?: "internal_draft" | "ready_to_send" | "shared_with_customer";
  client_disclaimer?: string | null;
  generated_at?: string | null;
  ready_to_send_at?: string | null;
  shared_with_customer_at?: string | null;
};

export type InquiryQuoteLineItem = {
  id: string;
  inquiry_id: string;
  pricing_catalog_item_id: string | null;
  item_name: string;
  category: string | null;
  variant: string | null;
  unit_label: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  sort_order: number | null;
  is_custom: boolean;
};

export const DEFAULT_BASE_FEE = 850;
export const DEFAULT_ITEMIZED_DISCLAIMER =
  "This itemized estimate is a draft for planning purposes. Final pricing may be adjusted based on event details, customization, and consultation.";

export function toMoneyNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function sanitizeOptionalMoney(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toMoneyNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateLineTotal(unitPrice: unknown, quantity: unknown) {
  const unit = Math.max(toMoneyNumber(unitPrice, 0), 0);
  const qty = Math.max(toMoneyNumber(quantity, 0), 0);
  return Number((unit * qty).toFixed(2));
}

export function calculateQuoteTotals(
  pricing: Partial<InquiryQuotePricing> | null | undefined,
  lineItems: Array<Partial<InquiryQuoteLineItem>>
) {
  const baseFee = Math.max(toMoneyNumber(pricing?.base_fee, DEFAULT_BASE_FEE), 0);
  const discountAmount = Math.max(
    toMoneyNumber(pricing?.discount_amount, 0),
    0
  );
  const deliveryFee = Math.max(toMoneyNumber(pricing?.delivery_fee, 0), 0);
  const laborAdjustment = toMoneyNumber(pricing?.labor_adjustment, 0);
  const taxAmount = Math.max(toMoneyNumber(pricing?.tax_amount, 0), 0);
  const manualTotalOverride = sanitizeOptionalMoney(pricing?.manual_total_override);

  const lineItemsTotal = Number(
    lineItems
      .reduce(
        (sum, item) =>
          sum +
          calculateLineTotal(item.unit_price ?? 0, item.quantity ?? 0),
        0
      )
      .toFixed(2)
  );

  const subtotal = Number(
    (baseFee + lineItemsTotal + deliveryFee + laborAdjustment - discountAmount).toFixed(2)
  );
  const calculatedTotal = Number((subtotal + taxAmount).toFixed(2));
  const grandTotal =
    manualTotalOverride !== null
      ? Number(manualTotalOverride.toFixed(2))
      : calculatedTotal;

  return {
    baseFee,
    lineItemsTotal,
    subtotal,
    discountAmount,
    deliveryFee,
    laborAdjustment,
    taxAmount,
    calculatedTotal,
    grandTotal,
    manualTotalOverride,
  };
}

export function formatCatalogLabel(item: Partial<PricingCatalogItem>) {
  return [item.name, item.variant].filter(Boolean).join(" • ");
}
