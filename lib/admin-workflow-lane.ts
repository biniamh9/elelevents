import type { CrmLead } from "@/lib/crm-analytics";
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
      href: `/admin/inquiries/${inquiry.id}`,
      attention:
        inquiry.quote_response_status === "changes_requested"
          ? "Revision needed"
          : null,
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
              ? "/admin/contracts"
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
  const base = `/admin/inquiries/${input.inquiryId}`;

  const laneActionMap: Record<WorkflowLaneKey, WorkflowActionGroup[]> = {
    intake: [
      {
        title: "Current step",
        actions: [
          { label: "Review request", href: `${base}#intake-stage` },
          { label: "Schedule consultation", href: `${base}#consultation-stage` },
        ],
      },
    ],
    consultation: [
      {
        title: "Current step",
        actions: [
          { label: "Open consultation plan", href: `${base}#consultation-stage` },
          { label: "Prepare quote", href: `${base}#quote-stage` },
        ],
      },
    ],
    quote: [
      {
        title: "Current step",
        actions: [
          { label: "Create quote", href: `${base}#quote-stage` },
          { label: "Share proposal", href: `${base}#quote-stage` },
        ],
      },
    ],
    contract: [
      {
        title: "Current step",
        actions: [
          {
            label: input.contractId ? "Open contract" : "Create contract",
            href: input.contractId ? `/admin/contracts/${input.contractId}` : `${base}#contract-stage`,
          },
          { label: "Track deposit", href: `${base}#contract-stage` },
        ],
      },
    ],
    handoff: [
      {
        title: "Current step",
        actions: [
          { label: "Open handoff", href: `${base}#handoff-stage` },
          { label: "Booking readiness", href: `${base}#booking-stage` },
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
  const base = `/admin/crm-analytics/${lead.id}`;

  const laneActionMap: Record<WorkflowLaneKey, WorkflowActionGroup[]> = {
    intake: [
      {
        title: "Current step",
        actions: [
          { label: "Review lead", href: base },
          { label: "Schedule consultation", href: `${base}#tasks` },
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
          { label: "Create quote", href: "/admin/documents/new?type=quote" },
          { label: "Add quote note", href: `${base}#notes` },
        ],
      },
    ],
    contract: [
      {
        title: "Current step",
        actions: [
          { label: "Schedule deposit follow-up", href: `${base}#tasks` },
          { label: "Mark booked", href: `${base}#booking` },
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
      href: `/admin/crm-analytics/${lead.id}`,
      attention: needsRevision ? "Revision needed" : null,
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
