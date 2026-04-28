import type { CrmLead } from "@/lib/crm-analytics";
import {
  buildContractDetailHref,
  buildContractsWorkspaceHref,
  buildCrmLeadDetailHref,
  buildQuoteCreateHref,
  buildInquiryDetailHref,
} from "@/lib/admin-navigation";
import {
  deriveWorkflowStage,
  getWorkflowStageFromBookingStage,
  type WorkflowStage,
} from "@/lib/workflow-stage";

export type WorkflowLaneKey = WorkflowStage;

export type WorkflowLaneItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  attention?: string | null;
  primaryAction?: WorkflowResolvedAction | null;
};

export type WorkflowLaneColumn = {
  key: WorkflowLaneKey;
  label: string;
  description: string;
  count: number;
  href: string;
  items: WorkflowLaneItem[];
};

export type WorkflowAction = {
  label: string;
  href: string;
};

export type WorkflowActionTone = "internal" | "email" | "sync" | "record";

export type WorkflowResolvedAction = WorkflowAction & {
  description: string;
  tone: WorkflowActionTone;
};

export type WorkflowActionGroup = {
  title: string;
  actions: WorkflowAction[];
};

const WORKFLOW_LANE_META: Array<{
  key: WorkflowLaneKey;
  label: string;
  description: string;
}> = [
  {
    key: "intake",
    label: "Intake",
    description: "New requests that still need review, qualification, or first contact.",
  },
  {
    key: "consultation",
    label: "Consultation",
    description: "Meeting planning and consultation follow-through before quoting.",
  },
  {
    key: "quote",
    label: "Quote",
    description: "Proposal building, sending, and quote-response follow-up.",
  },
  {
    key: "contract",
    label: "Contract",
    description: "Approved scope, contract creation, signature, and deposit collection.",
  },
  {
    key: "handoff",
    label: "Handoff",
    description: "Booked events moving into production readiness and operations.",
  },
];

export const getLaneFromBookingStage = getWorkflowStageFromBookingStage;

export function getInquiryWorkflowLane(input: {
  status: string | null;
  consultation_status: string | null;
  booking_stage: string | null;
  quote_response_status: string | null;
  contract_status?: string | null;
  deposit_paid?: boolean | null;
  completed_at?: string | null;
}) {
  return deriveWorkflowStage({
    bookingStage: input.booking_stage,
    inquiryStatus: input.status,
    consultationStatus: input.consultation_status,
    quoteResponseStatus: input.quote_response_status,
    contractStatus: input.contract_status,
    depositPaid: input.deposit_paid,
    completedAt: input.completed_at,
  });
}

export function getInquiryWorkflowPrimaryAction(input: {
  inquiryId: string;
  contractId?: string | null;
  status: string | null;
  consultation_status: string | null;
  booking_stage: string | null;
  quote_response_status: string | null;
  quoted_at?: string | null;
  contract_status?: string | null;
  deposit_paid?: boolean | null;
  completed_at?: string | null;
}): WorkflowResolvedAction {
  const lane = getInquiryWorkflowLane(input);
  const base = buildInquiryDetailHref(input.inquiryId);

  if (lane === "intake") {
    if ((input.status ?? "new") === "new") {
      return {
        label: "Review request",
        href: `${base}#intake-stage`,
        description: "Confirm fit, assign owner, and set the first follow-up.",
        tone: "internal",
      };
    }

    return {
      label: "Schedule consultation",
      href: `${base}#consultation-stage`,
      description: "Move the request out of intake by setting the meeting plan.",
      tone: "internal",
    };
  }

  if (lane === "consultation") {
    if ((input.consultation_status ?? "not_scheduled") === "completed") {
      return {
        label: "Prepare quote",
        href: `${base}#quote-stage`,
        description: "Turn consultation notes into the client-facing proposal.",
        tone: "record",
      };
    }

    return {
      label:
        (input.consultation_status ?? "not_scheduled") === "scheduled"
          ? "Complete consultation"
          : "Plan consultation",
      href: `${base}#consultation-stage`,
      description: "Keep meeting timing and follow-up visible in one place.",
      tone: "internal",
    };
  }

  if (lane === "quote") {
    if (input.quote_response_status === "changes_requested") {
      return {
        label: "Revise quote",
        href: `${base}#quote-stage`,
        description: "Client changes are waiting. Update pricing and resend.",
        tone: "email",
      };
    }

    const quoteIsInMotion = input.status === "quoted" || Boolean(input.quoted_at);
    return {
      label: quoteIsInMotion ? "Follow up on quote" : "Build quote",
      href: `${base}#quote-stage`,
      description: quoteIsInMotion
        ? "Keep the proposal moving instead of letting it stall."
        : "Create the proposal and share it from the quote stage.",
      tone: quoteIsInMotion ? "email" : "record",
    };
  }

  if (lane === "contract") {
    if (!input.contractId) {
      return {
        label: "Create contract",
        href: `${base}#contract-stage`,
        description: "Turn the approved scope into a contract and deposit path.",
        tone: "record",
      };
    }

    if (input.contract_status === "draft") {
      return {
        label: "Send contract",
        href: buildContractDetailHref(input.contractId),
        description: "Get the agreement out for signature instead of leaving it in draft.",
        tone: "email",
      };
    }

    if (!input.deposit_paid) {
      return {
        label: "Track deposit",
        href: buildContractDetailHref(input.contractId),
        description: "Signature or deposit is still open. Keep the booking from drifting.",
        tone: "sync",
      };
    }

    return {
      label: "Confirm handoff",
      href: `${base}#handoff-stage`,
      description: "The contract is in place. Move the event into production readiness.",
      tone: "internal",
    };
  }

  return {
    label: "Open handoff",
    href: `${base}#handoff-stage`,
    description: "Advance readiness, logistics, and production milestones.",
    tone: "internal",
  };
}

export function getInquiryWorkflowSecondaryAction(input: {
  inquiryId: string;
  contractId?: string | null;
  status: string | null;
  consultation_status: string | null;
  booking_stage: string | null;
  quote_response_status: string | null;
  quoted_at?: string | null;
  contract_status?: string | null;
  deposit_paid?: boolean | null;
  completed_at?: string | null;
}): WorkflowResolvedAction | null {
  const lane = getInquiryWorkflowLane(input);
  const base = buildInquiryDetailHref(input.inquiryId);

  if (lane === "intake") {
    return {
      label: "Open workflow",
      href: `${base}#next-action`,
      description: "See the full sequence before changing status.",
      tone: "internal",
    };
  }

  if (lane === "consultation") {
    return {
      label: "Review intake notes",
      href: `${base}#intake-stage`,
      description: "Check owner, notes, and original request context.",
      tone: "internal",
    };
  }

  if (lane === "quote") {
    return {
      label: "Review client replies",
      href: `${base}#timeline`,
      description: "Use the latest client feedback while moving the quote.",
      tone: "email",
    };
  }

  if (lane === "contract") {
    return {
      label: "Open quote context",
      href: `${base}#quote-stage`,
      description: "Check the approved pricing and revision history.",
      tone: "internal",
    };
  }

  return {
    label: "Open booking readiness",
    href: `${base}#booking-stage`,
    description: "Use the checklist and production milestones together.",
    tone: "sync",
  };
}

export function buildWorkflowColumnsFromInquiries(
  inquiries: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    event_type: string | null;
    event_date: string | null;
    status: string | null;
    consultation_status: string | null;
    booking_stage: string | null;
    quote_response_status: string | null;
    quoted_at?: string | null;
    completed_at?: string | null;
    contract_status?: string | null;
    deposit_paid?: boolean | null;
  }>
): WorkflowLaneColumn[] {
  const grouped = new Map<WorkflowLaneKey, WorkflowLaneItem[]>();

  for (const lane of WORKFLOW_LANE_META) {
    grouped.set(lane.key, []);
  }

  for (const inquiry of inquiries) {
    const lane = deriveWorkflowStage({
      bookingStage: inquiry.booking_stage,
      inquiryStatus: inquiry.status,
      consultationStatus: inquiry.consultation_status,
      quoteResponseStatus: inquiry.quote_response_status,
      contractStatus: inquiry.contract_status,
      depositPaid: inquiry.deposit_paid,
      completedAt: inquiry.completed_at ?? null,
    });
    grouped.get(lane)?.push({
      id: inquiry.id,
      title: `${inquiry.first_name ?? ""} ${inquiry.last_name ?? ""}`.trim() || "Unnamed inquiry",
      subtitle:
        inquiry.quote_response_status === "changes_requested"
          ? "Client requested quote changes"
          : [inquiry.event_type, inquiry.event_date].filter(Boolean).join(" • ") || "Event details pending",
      href: buildInquiryDetailHref(inquiry.id),
      attention:
        inquiry.quote_response_status === "changes_requested"
          ? "Revision needed"
          : null,
      primaryAction: getInquiryWorkflowPrimaryAction({
        inquiryId: inquiry.id,
        status: inquiry.status,
        consultation_status: inquiry.consultation_status,
        booking_stage: inquiry.booking_stage,
        quote_response_status: inquiry.quote_response_status,
        quoted_at: inquiry.quoted_at ?? null,
        contract_status: inquiry.contract_status ?? null,
        deposit_paid: inquiry.deposit_paid ?? null,
        completed_at: inquiry.completed_at ?? null,
      }),
    });
  }

  return WORKFLOW_LANE_META.map((lane) => ({
    ...lane,
    count: grouped.get(lane.key)?.length ?? 0,
    href:
      lane.key === "intake"
        ? "/admin/inquiries?tab=inquiries&status=new"
        : lane.key === "consultation"
          ? "/admin/inquiries?tab=schedule"
          : lane.key === "quote"
            ? "/admin/inquiries?tab=inquiries&status=quoted"
            : lane.key === "contract"
              ? buildContractsWorkspaceHref({ queue: "unsigned" })
              : "/admin/inquiries?tab=schedule",
    items: (grouped.get(lane.key) ?? [])
      .sort((a, b) => Number(Boolean(b.attention)) - Number(Boolean(a.attention)))
      .slice(0, 4),
  }));
}

export function getInquiryWorkflowActionGroups(input: {
  inquiryId: string;
  contractId?: string | null;
  status: string | null;
  consultation_status: string | null;
  booking_stage: string | null;
  quote_response_status: string | null;
  contract_status?: string | null;
  deposit_paid?: boolean | null;
  completed_at?: string | null;
}): WorkflowActionGroup[] {
  const lane = getInquiryWorkflowLane(input);
  const base = buildInquiryDetailHref(input.inquiryId);

  const laneActionMap: Record<WorkflowLaneKey, WorkflowActionGroup[]> = {
    intake: [
      {
        title: "Current step",
        actions: [
          { label: "Review request", href: `${base}#intake-stage` },
          { label: "Open consultation scheduling", href: `${base}#consultation-stage` },
        ],
      },
    ],
    consultation: [
      {
        title: "Current step",
        actions: [
          { label: "Open consultation plan", href: `${base}#consultation-stage` },
          { label: "Open quote preparation", href: `${base}#quote-stage` },
        ],
      },
    ],
    quote: [
      {
        title: "Current step",
        actions: [
          { label: "Open quote builder", href: `${base}#quote-stage` },
          { label: "Open quote sharing", href: `${base}#quote-stage` },
        ],
      },
    ],
    contract: [
      {
        title: "Current step",
        actions: [
          {
            label: input.contractId ? "Open contract" : "Create contract",
            href: input.contractId ? buildContractDetailHref(input.contractId) : `${base}#contract-stage`,
          },
          { label: "Open deposit tracking", href: `${base}#contract-stage` },
        ],
      },
    ],
    handoff: [
      {
        title: "Current step",
        actions: [
          { label: "Open handoff", href: `${base}#handoff-stage` },
          { label: "Open booking readiness", href: `${base}#booking-stage` },
        ],
      },
    ],
  };

  return [
    {
      title: "Record",
      actions: [
        { label: "View details", href: base },
        { label: "Open workflow", href: `${base}#next-action` },
      ],
    },
    ...laneActionMap[lane],
  ];
}

export function getLaneFromCrmLead(lead: CrmLead): WorkflowLaneKey | null {
  switch (lead.stage) {
    case "new_inquiry":
    case "contacted":
      return "intake";
    case "consultation_scheduled":
    case "consultation_completed":
      return "consultation";
    case "quote_sent":
      return "quote";
    case "awaiting_deposit":
      return "contract";
    case "booked":
      return "handoff";
    case "lost":
      return null;
    default:
      return "intake";
  }
}

export function getCrmLeadWorkflowActionGroups(lead: CrmLead): WorkflowActionGroup[] {
  const lane = getLaneFromCrmLead(lead) ?? "intake";
  const base = buildCrmLeadDetailHref(lead.id);

  const laneActionMap: Record<WorkflowLaneKey, WorkflowActionGroup[]> = {
    intake: [
      {
        title: "Current step",
        actions: [
          { label: "Review lead", href: base },
          { label: "Open consultation follow-up", href: `${base}#tasks` },
        ],
      },
    ],
    consultation: [
      {
        title: "Current step",
        actions: [
          { label: "Open consultation context", href: base },
          { label: "Schedule follow-up", href: `${base}#tasks` },
        ],
      },
    ],
    quote: [
      {
        title: "Current step",
        actions: [
          { label: "Open quote draft", href: buildQuoteCreateHref({ inquiryId: lead.id }) },
          { label: "Add quote note", href: `${base}#notes` },
        ],
      },
    ],
    contract: [
      {
        title: "Current step",
        actions: [
          { label: "Schedule deposit follow-up", href: `${base}#tasks` },
          { label: "Open booking confirmation", href: `${base}#booking` },
        ],
      },
    ],
    handoff: [
      {
        title: "Current step",
        actions: [
          { label: "Open customer record", href: base },
          { label: "Review next tasks", href: `${base}#tasks` },
        ],
      },
    ],
  };

  return [
    {
      title: "Lead record",
      actions: [
        { label: "View lead", href: base },
        { label: "Add note", href: `${base}#notes` },
      ],
    },
    ...laneActionMap[lane],
    {
      title: "Stage updates",
      actions: [
        { label: "Move stage", href: `${base}#stage` },
        { label: "Mark lost", href: `${base}#lost` },
      ],
    },
  ];
}

export function getCrmLeadPrimaryWorkflowAction(lead: CrmLead): WorkflowResolvedAction {
  const base = buildCrmLeadDetailHref(lead.id);
  const lane = getLaneFromCrmLead(lead) ?? "intake";

  if (lane === "intake") {
    return {
      label: "Review lead",
      href: base,
      description: "Confirm owner, next action, and first response context.",
      tone: "internal",
    };
  }

  if (lane === "consultation") {
    return {
      label: "Open consultation context",
      href: `${base}#tasks`,
      description: "Use the lead record and next actions to move the meeting forward.",
      tone: "internal",
    };
  }

  if (lane === "quote") {
    return {
      label: "Open quote draft",
      href: buildQuoteCreateHref({ inquiryId: lead.id }),
      description: "Move from client direction into proposal work without switching modules.",
      tone: "record",
    };
  }

  if (lane === "contract") {
    return {
      label: "Track deposit follow-up",
      href: `${base}#tasks`,
      description: "Keep contract and deposit movement tied to the lead.",
      tone: "sync",
    };
  }

  return {
    label: "Review booked handoff",
    href: `${base}#tasks`,
    description: "Use the lead record as the handoff control point for booked work.",
    tone: "internal",
  };
}

export function buildWorkflowColumnsFromCrmLeads(
  leads: CrmLead[],
  options?: { revisionLeadIds?: Set<string> }
): WorkflowLaneColumn[] {
  const grouped = new Map<WorkflowLaneKey, WorkflowLaneItem[]>();

  for (const lane of WORKFLOW_LANE_META) {
    grouped.set(lane.key, []);
  }

  for (const lead of leads) {
    const lane = getLaneFromCrmLead(lead);
    if (!lane) continue;
    const needsRevision = options?.revisionLeadIds?.has(lead.id) ?? false;

    grouped.get(lane)?.push({
      id: lead.id,
      title: lead.clientName,
      subtitle: needsRevision
        ? "Client requested quote changes"
        : `${lead.eventType} • ${lead.eventDate}`,
      href: buildCrmLeadDetailHref(lead.id),
      attention: needsRevision ? "Revision needed" : null,
      primaryAction: getCrmLeadPrimaryWorkflowAction(lead),
    });
  }

  return WORKFLOW_LANE_META.map((lane) => ({
    ...lane,
    count: grouped.get(lane.key)?.length ?? 0,
    href:
      lane.key === "intake"
        ? "/admin/crm-analytics?tab=leads&stage=new_inquiry"
        : lane.key === "consultation"
          ? "/admin/crm-analytics?tab=leads&stage=consultation_scheduled"
          : lane.key === "quote"
            ? "/admin/crm-analytics?tab=leads&stage=quote_sent"
            : lane.key === "contract"
              ? "/admin/crm-analytics?tab=leads&stage=awaiting_deposit"
              : "/admin/crm-analytics?tab=leads&stage=booked",
    items: (grouped.get(lane.key) ?? [])
      .sort((a, b) => Number(Boolean(b.attention)) - Number(Boolean(a.attention)))
      .slice(0, 4),
  }));
}
