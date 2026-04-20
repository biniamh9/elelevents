import {
  deriveBookingStage,
  humanizeBookingStage,
  type BookingStage,
} from "@/lib/booking-lifecycle";

export const WORKFLOW_STAGES = [
  "intake",
  "consultation",
  "quote",
  "contract",
  "handoff",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type WorkflowSourceInput = {
  bookingStage?: string | null;
  inquiryStatus?: string | null;
  consultationStatus?: string | null;
  quoteResponseStatus?: string | null;
  contractStatus?: string | null;
  depositPaid?: boolean | null;
  completedAt?: string | null;
};

export function getWorkflowStageFromBookingStage(stage: BookingStage): WorkflowStage {
  if (stage === "consultation_scheduled") {
    return "consultation";
  }

  if (stage === "quote_sent") {
    return "quote";
  }

  if (stage === "contract_sent" || stage === "signed_deposit_paid") {
    return "contract";
  }

  if (stage === "reserved" || stage === "completed") {
    return "handoff";
  }

  return "intake";
}

export function deriveWorkflowStage(input: WorkflowSourceInput) {
  return getWorkflowStageFromBookingStage(
    deriveBookingStage({
      bookingStage: input.bookingStage,
      inquiryStatus: input.inquiryStatus,
      consultationStatus: input.consultationStatus,
      quoteResponseStatus: input.quoteResponseStatus,
      contractStatus: input.contractStatus,
      depositPaid: input.depositPaid,
      completedAt: input.completedAt,
    })
  );
}

export function getWorkflowStageSummary(input: WorkflowSourceInput) {
  const bookingStage = deriveBookingStage({
    bookingStage: input.bookingStage,
    inquiryStatus: input.inquiryStatus,
    consultationStatus: input.consultationStatus,
    quoteResponseStatus: input.quoteResponseStatus,
    contractStatus: input.contractStatus,
    depositPaid: input.depositPaid,
    completedAt: input.completedAt,
  });

  return {
    workflowStage: getWorkflowStageFromBookingStage(bookingStage),
    bookingStage,
    bookingLabel: humanizeBookingStage(bookingStage),
  };
}
