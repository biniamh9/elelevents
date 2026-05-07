import type { CrmStage } from "@/lib/crm-analytics";
import type { WorkflowStage } from "@/lib/workflow-stage";

export const EVENT_PROJECT_STATUSES = [
  "new_inquiry",
  "under_review",
  "contacted",
  "consultation_scheduled",
  "consultation_completed",
  "quote_drafted",
  "quote_sent",
  "quote_accepted",
  "contract_sent",
  "contract_signed",
  "deposit_paid",
  "event_reserved",
  "planning_in_progress",
  "final_payment_due",
  "final_payment_paid",
  "completed",
  "lost_cancelled",
  "archived",
] as const;

export type EventProjectStatus = (typeof EVENT_PROJECT_STATUSES)[number];

export const EVENT_PROJECT_STATUS_LABELS: Record<EventProjectStatus, string> = {
  new_inquiry: "New Inquiry",
  under_review: "Under Review",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  consultation_completed: "Consultation Completed",
  quote_drafted: "Quote Drafted",
  quote_sent: "Quote Sent",
  quote_accepted: "Quote Accepted",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  deposit_paid: "Deposit Paid",
  event_reserved: "Event Reserved",
  planning_in_progress: "Planning In Progress",
  final_payment_due: "Final Payment Due",
  final_payment_paid: "Final Payment Paid",
  completed: "Completed",
  lost_cancelled: "Lost / Cancelled",
  archived: "Archived",
};

export function normalizeEventProjectStatus(
  value: string | null | undefined
): EventProjectStatus | null {
  if (!value) return null;
  return EVENT_PROJECT_STATUSES.includes(value as EventProjectStatus)
    ? (value as EventProjectStatus)
    : null;
}

export function humanizeEventProjectStatus(value: string | null | undefined) {
  const normalized = normalizeEventProjectStatus(value);
  if (normalized) {
    return EVENT_PROJECT_STATUS_LABELS[normalized];
  }

  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function deriveEventProjectStatusFromLegacy(input: {
  inquiryStatus?: string | null;
  bookingStage?: string | null;
  quoteResponseStatus?: string | null;
  consultationStatus?: string | null;
  contractStatus?: string | null;
  paymentStatus?: string | null;
  depositPaid?: boolean | null;
  completedAt?: string | null;
}) {
  if (input.inquiryStatus === "archived") return "archived" as const;
  if (input.inquiryStatus === "closed_lost") return "lost_cancelled" as const;
  if (input.completedAt || input.bookingStage === "completed") return "completed" as const;
  if (input.paymentStatus === "paid" || input.bookingStage === "reserved") return "event_reserved" as const;
  if (input.paymentStatus === "deposit_paid" || input.depositPaid || input.bookingStage === "signed_deposit_paid") {
    return "deposit_paid" as const;
  }
  if (input.contractStatus === "signed") return "contract_signed" as const;
  if (input.contractStatus === "sent" || input.contractStatus === "draft" || input.quoteResponseStatus === "accepted") {
    return "contract_sent" as const;
  }
  if (input.quoteResponseStatus === "awaiting_response" || input.quoteResponseStatus === "changes_requested" || input.inquiryStatus === "quoted") {
    return "quote_sent" as const;
  }
  if (input.consultationStatus === "completed") return "consultation_completed" as const;
  if (input.consultationStatus === "scheduled" || input.consultationStatus === "approved") {
    return "consultation_scheduled" as const;
  }
  if (input.consultationStatus === "under_review") return "under_review" as const;
  if (input.inquiryStatus === "contacted") return "contacted" as const;
  return "new_inquiry" as const;
}

export function mapEventProjectStatusToCrmStage(status: string | null | undefined): CrmStage {
  const normalized = normalizeEventProjectStatus(status);
  switch (normalized) {
    case "contacted":
      return "contacted";
    case "consultation_scheduled":
      return "consultation_scheduled";
    case "consultation_completed":
    case "quote_drafted":
      return "consultation_completed";
    case "quote_sent":
    case "quote_accepted":
      return "quote_sent";
    case "contract_sent":
    case "contract_signed":
    case "deposit_paid":
      return "awaiting_deposit";
    case "event_reserved":
    case "planning_in_progress":
    case "final_payment_due":
    case "final_payment_paid":
    case "completed":
      return "booked";
    case "lost_cancelled":
    case "archived":
      return "lost";
    case "under_review":
    case "new_inquiry":
    default:
      return "new_inquiry";
  }
}

export function mapEventProjectStatusToWorkflowStage(
  status: string | null | undefined
): WorkflowStage {
  const normalized = normalizeEventProjectStatus(status);
  switch (normalized) {
    case "consultation_scheduled":
    case "consultation_completed":
      return "consultation";
    case "quote_drafted":
    case "quote_sent":
    case "quote_accepted":
      return "quote";
    case "contract_sent":
    case "contract_signed":
    case "deposit_paid":
      return "contract";
    case "event_reserved":
    case "planning_in_progress":
    case "final_payment_due":
    case "final_payment_paid":
    case "completed":
      return "handoff";
    case "under_review":
    case "contacted":
    case "new_inquiry":
    case "lost_cancelled":
    case "archived":
    default:
      return "intake";
  }
}

export function isClosedEventProjectStatus(status: string | null | undefined) {
  const normalized = normalizeEventProjectStatus(status);
  return normalized === "lost_cancelled" || normalized === "archived" || normalized === "completed";
}
