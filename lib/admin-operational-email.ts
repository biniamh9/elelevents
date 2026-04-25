export type AdminOperationalEmailKind =
  | "event_request"
  | "event_inquiry"
  | "consultation"
  | "rental_request";

type AdminOperationalEmailGuidance = {
  nextStepsTitle: string;
  nextStepsContent: string;
  footerNote: string;
};

const ADMIN_OPERATIONAL_EMAIL_GUIDANCE: Record<
  AdminOperationalEmailKind,
  AdminOperationalEmailGuidance
> = {
  event_request: {
    nextStepsTitle: "Next steps",
    nextStepsContent:
      "Review the lead details, confirm whether consultation should be scheduled, and capture any missing planning information before moving the request deeper into the workflow.",
    footerNote:
      "Review this lead in the admin workspace to continue follow-up and consultation scheduling.",
  },
  event_inquiry: {
    nextStepsTitle: "Next steps",
    nextStepsContent:
      "Open the inquiry record, review consultation preference and decor selections, then decide whether the next action is consultation scheduling, scope clarification, or quote preparation.",
    footerNote:
      "Open the inquiry record to review consultation preference, decor selections, and next steps.",
  },
  consultation: {
    nextStepsTitle: "Next steps",
    nextStepsContent:
      "Review the consultation details, confirm internal preparation, and make sure the appropriate design references or meeting access details are ready before the scheduled session.",
    footerNote:
      "Open the consultation record in the admin workspace if timing, format, or meeting access details need to be adjusted.",
  },
  rental_request: {
    nextStepsTitle: "Next steps",
    nextStepsContent:
      "Review the requested rental items, confirm availability and service fees, then move the request into quoting or client follow-up from the rental pipeline.",
    footerNote:
      "Open Admin > Rentals > Requests to review and move this quote request through the rental pipeline.",
  },
};

export function getAdminOperationalEmailGuidance(
  kind: AdminOperationalEmailKind
) {
  return ADMIN_OPERATIONAL_EMAIL_GUIDANCE[kind];
}
