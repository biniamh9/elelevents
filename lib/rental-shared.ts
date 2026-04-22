import { RENTAL_DEPOSIT_TYPES, RENTAL_PRICE_TYPES } from "@/lib/validations/rentals";

export type RentalPriceType = (typeof RENTAL_PRICE_TYPES)[number];
export type RentalDepositType = (typeof RENTAL_DEPOSIT_TYPES)[number];
export type RentalDepositStatus =
  | "not_required"
  | "pending"
  | "collected"
  | "partially_refunded"
  | "refunded"
  | "forfeited";
export type RentalInspectionStatus = "pending" | "returned" | "inspected";
export type RentalRefundStatus = "not_started" | "pending" | "processed";

export type RentalItemImage = {
  id: string;
  rental_item_id: string;
  image_url: string;
  image_path: string | null;
  sort_order: number;
  created_at: string;
};

export type RentalItem = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  full_description: string | null;
  featured_image_url: string | null;
  featured_image_path?: string | null;
  base_rental_price: number;
  price_type: RentalPriceType;
  available_quantity: number;
  minimum_order_quantity: number;
  delivery_available: boolean;
  setup_available: boolean;
  breakdown_available: boolean;
  default_delivery_fee: number;
  default_setup_fee: number;
  default_breakdown_fee: number;
  deposit_required: boolean;
  deposit_type: RentalDepositType;
  deposit_amount: number;
  replacement_cost: number;
  deposit_terms: string | null;
  damage_notes: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images?: RentalItemImage[];
};

export type RentalDepositRecord = {
  id: string;
  rental_item_id: string;
  reference_label: string | null;
  deposit_collected_amount: number;
  deposit_status: RentalDepositStatus;
  inspection_status: RentalInspectionStatus;
  damage_deduction_amount: number;
  refund_amount: number;
  refund_status: RentalRefundStatus;
  refund_date: string | null;
  damage_notes: string | null;
  created_at: string;
  updated_at: string;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function slugifyRentalName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatMoney(value: number | null | undefined) {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRentalPrice(value: number, priceType: RentalPriceType) {
  const suffix =
    priceType === "flat_rate"
      ? "flat rate"
      : priceType === "per_set"
        ? "per set"
        : "per item";

  return `${formatMoney(value)} ${suffix}`;
}

export type RentalQuoteInput = {
  quantity: number;
  baseRentalPrice: number;
  priceType: RentalPriceType;
  depositRequired?: boolean;
  depositType?: RentalDepositType;
  depositAmount?: number;
  deliveryFee?: number;
  setupFee?: number;
  breakdownFee?: number;
  includeDelivery?: boolean;
  includeSetup?: boolean;
  includeBreakdown?: boolean;
};

export function calculateRentalSubtotal({
  quantity,
  baseRentalPrice,
  priceType,
}: Pick<RentalQuoteInput, "quantity" | "baseRentalPrice" | "priceType">) {
  const normalizedQuantity = Math.max(toNumber(quantity, 1), 1);
  const normalizedPrice = Math.max(toNumber(baseRentalPrice, 0), 0);

  if (priceType === "flat_rate") {
    return Number(normalizedPrice.toFixed(2));
  }

  return Number((normalizedQuantity * normalizedPrice).toFixed(2));
}

export function calculateRentalSecurityDeposit({
  quantity,
  subtotal,
  depositRequired,
  depositType,
  depositAmount,
}: {
  quantity: number;
  subtotal: number;
  depositRequired?: boolean;
  depositType?: RentalDepositType;
  depositAmount?: number;
}) {
  if (!depositRequired) {
    return 0;
  }

  const normalizedAmount = Math.max(toNumber(depositAmount, 0), 0);
  if (normalizedAmount <= 0) {
    return 0;
  }

  if (depositType === "percent") {
    return Number(((Math.max(subtotal, 0) * normalizedAmount) / 100).toFixed(2));
  }

  if (depositType === "per_item") {
    return Number((Math.max(toNumber(quantity, 1), 1) * normalizedAmount).toFixed(2));
  }

  return Number(normalizedAmount.toFixed(2));
}

export function calculateRentalQuoteTotals(input: RentalQuoteInput) {
  const subtotal = calculateRentalSubtotal(input);
  const deliveryFee = input.includeDelivery ? Math.max(toNumber(input.deliveryFee, 0), 0) : 0;
  const setupFee = input.includeSetup ? Math.max(toNumber(input.setupFee, 0), 0) : 0;
  const breakdownFee = input.includeBreakdown ? Math.max(toNumber(input.breakdownFee, 0), 0) : 0;
  const securityDeposit = calculateRentalSecurityDeposit({
    quantity: input.quantity,
    subtotal,
    depositRequired: input.depositRequired,
    depositType: input.depositType,
    depositAmount: input.depositAmount,
  });
  const serviceTotal = Number((subtotal + deliveryFee + setupFee + breakdownFee).toFixed(2));
  const total = Number((serviceTotal + securityDeposit).toFixed(2));

  return {
    subtotal,
    deliveryFee,
    setupFee,
    breakdownFee,
    securityDeposit,
    serviceTotal,
    total,
  };
}

export function calculateDepositRefundAmount(
  depositCollectedAmount: number,
  damageDeductionAmount: number
) {
  return Number(
    Math.max(
      Math.max(toNumber(depositCollectedAmount, 0), 0) - Math.max(toNumber(damageDeductionAmount, 0), 0),
      0
    ).toFixed(2)
  );
}
