import { formatMoney } from "@/lib/rental-shared";

export const RENTAL_STORAGE_ZIP = "30083";
export const RENTAL_SETUP_FEE_PER_CHAIR = 1;
export const RENTAL_BREAKDOWN_FEE_PER_CHAIR = 1;
export const RENTAL_BASE_REFUNDABLE_DEPOSIT = 500;
export const RENTAL_DEPOSIT_PER_CHAIR_OVER_THRESHOLD = 10;
export const RENTAL_DEPOSIT_THRESHOLD = 100;

export const RENTAL_REFUNDABLE_DEPOSIT_NOTE =
  "Refundable deposit is required to reserve rental items. Deposit may be fully refunded after all chairs are returned in the same condition. Damage, missing items, or late return may be deducted from the deposit.";

export type RentalQuotePricingInput = {
  chairQuantity: number;
  chairUnitPrice: number;
  distanceMiles: number | null;
  deliveryRequired: boolean;
  setupRequired: boolean;
  breakdownRequired: boolean;
};

export type RentalQuotePricingResult = {
  chairQuantity: number;
  chairUnitPrice: number;
  chairSubtotal: number;
  distanceMiles: number | null;
  deliveryFee: number;
  deliveryCustomQuoteRequired: boolean;
  setupFee: number;
  breakdownFee: number;
  refundableDeposit: number;
  totalQuote: number;
  quoteNotes: string;
};

function toMoney(value: number) {
  return Number(Math.max(value, 0).toFixed(2));
}

export function getMileageDeliveryFee(distanceMiles: number | null | undefined) {
  if (distanceMiles == null || !Number.isFinite(distanceMiles)) {
    return { fee: 0, customQuoteRequired: false };
  }

  if (distanceMiles < 20) return { fee: 300, customQuoteRequired: false };
  if (distanceMiles <= 30) return { fee: 500, customQuoteRequired: false };
  if (distanceMiles <= 40) return { fee: 650, customQuoteRequired: false };
  if (distanceMiles <= 50) return { fee: 750, customQuoteRequired: false };
  if (distanceMiles <= 60) return { fee: 850, customQuoteRequired: false };
  return { fee: 0, customQuoteRequired: true };
}

export function calculateChairRefundableDeposit(chairQuantity: number) {
  const quantity = Math.max(Math.trunc(chairQuantity || 0), 0);
  if (quantity <= RENTAL_DEPOSIT_THRESHOLD) {
    return RENTAL_BASE_REFUNDABLE_DEPOSIT;
  }

  return RENTAL_BASE_REFUNDABLE_DEPOSIT + quantity * RENTAL_DEPOSIT_PER_CHAIR_OVER_THRESHOLD;
}

export function calculateRentalChairQuote(input: RentalQuotePricingInput): RentalQuotePricingResult {
  const chairQuantity = Math.max(Math.trunc(input.chairQuantity || 0), 0);
  const chairUnitPrice = toMoney(input.chairUnitPrice || 0);
  const chairSubtotal = toMoney(chairQuantity * chairUnitPrice);
  const delivery = input.deliveryRequired
    ? getMileageDeliveryFee(input.distanceMiles)
    : { fee: 0, customQuoteRequired: false };
  const setupFee = input.setupRequired ? toMoney(chairQuantity * RENTAL_SETUP_FEE_PER_CHAIR) : 0;
  const breakdownFee = input.breakdownRequired
    ? toMoney(chairQuantity * RENTAL_BREAKDOWN_FEE_PER_CHAIR)
    : 0;
  const refundableDeposit = calculateChairRefundableDeposit(chairQuantity);
  const totalQuote = delivery.customQuoteRequired
    ? toMoney(chairSubtotal + setupFee + breakdownFee + refundableDeposit)
    : toMoney(chairSubtotal + delivery.fee + setupFee + breakdownFee + refundableDeposit);

  const quoteNotes = [
    RENTAL_REFUNDABLE_DEPOSIT_NOTE,
    delivery.customQuoteRequired
      ? `Delivery from storage ZIP ${RENTAL_STORAGE_ZIP} is more than 60 miles and requires a custom delivery quote.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    chairQuantity,
    chairUnitPrice,
    chairSubtotal,
    distanceMiles: input.distanceMiles,
    deliveryFee: delivery.fee,
    deliveryCustomQuoteRequired: delivery.customQuoteRequired,
    setupFee,
    breakdownFee,
    refundableDeposit,
    totalQuote,
    quoteNotes,
  };
}

export function formatDeliveryFeeLabel(result: {
  deliveryFee?: number;
  deliveryCustomQuoteRequired?: boolean;
  delivery_fee?: number;
  delivery_custom_quote_required?: boolean;
}) {
  const customQuoteRequired =
    result.deliveryCustomQuoteRequired ?? result.delivery_custom_quote_required ?? false;
  const deliveryFee = result.deliveryFee ?? result.delivery_fee ?? 0;
  return customQuoteRequired ? "Custom quote required" : formatMoney(deliveryFee);
}
