export const BOOKING_STAGES = [
  "inquiry",
  "consultation_scheduled",
  "quote_sent",
  "contract_sent",
  "signed_deposit_paid",
  "reserved",
  "completed",
] as const;

export type BookingStage = (typeof BOOKING_STAGES)[number];

export function humanizeBookingStage(stage: string | null | undefined) {
  if (!stage) {
    return "Inquiry";
  }

  return stage
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeBookingStage(value: string | null | undefined): BookingStage {
  return BOOKING_STAGES.includes((value ?? "") as BookingStage)
    ? ((value ?? "inquiry") as BookingStage)
    : "inquiry";
}

export function deriveBookingStage(input: {
  bookingStage?: string | null;
  inquiryStatus?: string | null;
  consultationStatus?: string | null;
  quoteResponseStatus?: string | null;
  contractStatus?: string | null;
  depositPaid?: boolean | null;
  completedAt?: string | null;
}) {
  if (input.completedAt || input.bookingStage === "completed") {
    return "completed" as BookingStage;
  }

  if (input.bookingStage && BOOKING_STAGES.includes(input.bookingStage as BookingStage)) {
    return input.bookingStage as BookingStage;
  }

  if (input.inquiryStatus === "booked") {
    return "reserved";
  }

  if (input.depositPaid) {
    return "signed_deposit_paid";
  }

  if (input.contractStatus === "sent" || input.contractStatus === "signed") {
    return "contract_sent";
  }

  if (
    input.quoteResponseStatus === "awaiting_response" ||
    input.inquiryStatus === "quoted"
  ) {
    return "quote_sent";
  }

  if (
    input.consultationStatus === "approved" ||
    input.consultationStatus === "under_review" ||
    input.consultationStatus === "scheduled" ||
    input.consultationStatus === "completed" ||
    input.consultationStatus === "reschedule_needed"
  ) {
    return "consultation_scheduled";
  }

  return "inquiry";
}

export function getBookingWarningLabel(totalEventsOnDate: number) {
  if (totalEventsOnDate >= 2) {
    return "Multiple bookings";
  }

  if (totalEventsOnDate >= 1) {
    return "Double booking";
  }

  return null;
}

export function getPaymentSummary(input: {
  contractTotal?: number | null;
  depositAmount?: number | null;
  depositPaid?: boolean | null;
  balancePaid?: boolean | null;
}) {
  const contractTotal = Number(input.contractTotal ?? 0);
  const depositAmount = Number(input.depositAmount ?? 0);
  const remainingBalance = Math.max(contractTotal - depositAmount, 0);

  let paymentStatus: "pending" | "partial" | "paid" = "pending";
  if (input.balancePaid) {
    paymentStatus = "paid";
  } else if (input.depositPaid) {
    paymentStatus = "partial";
  }

  return {
    contractTotal,
    depositAmount,
    remainingBalance,
    paymentStatus,
  };
}
