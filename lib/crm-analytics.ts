import type { CrmLeadTemperature, CrmLostReason } from "@/lib/crm-options";

export type CrmStage =
  | "new_inquiry"
  | "contacted"
  | "consultation_scheduled"
  | "consultation_completed"
  | "quote_sent"
  | "awaiting_deposit"
  | "booked"
  | "lost";

export type LeadSource =
  | "Website"
  | "Referral"
  | "Instagram"
  | "Returning Client"
  | "Vendor Partner";

export type InteractionType =
  | "note"
  | "call"
  | "email"
  | "consultation"
  | "quote"
  | "payment";

export type CrmTaskStatus = "overdue" | "today" | "awaiting_reply" | "deposit" | "contract";

export type CrmLead = {
  id: string;
  clientId?: string | null;
  clientName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  venue: string;
  stage: CrmStage;
  estimatedValue: number;
  lastContact: string;
  nextFollowUp: string;
  owner: string;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  leadScore?: number | null;
  leadTemperature?: CrmLeadTemperature | null;
  source: LeadSource;
  budgetRange: string;
  quoteSummary: string;
  paymentSummary: string;
  notes: string[];
  contractStatus?: "unsigned" | "sent" | "signed";
  paymentStatus?: "unpaid" | "deposit_due" | "deposit_paid" | "paid";
  decorStatus?: "pending" | "in_progress" | "approved" | "ready";
  lostReason?: CrmLostReason;
  lostAt?: string | null;
  lostContext?: string | null;
  hasFollowUpInspiration?: boolean;
  contractId?: string | null;
  inquiryStatus?: string | null;
  consultationStatus?: string | null;
  quoteResponseStatus?: string | null;
  bookingStage?: string | null;
  createdAt?: string;
  consultationAt?: string | null;
  bookedAt?: string | null;
  firstResponseHours?: number | null;
  outstandingBalance?: number;
};

export type CrmInteraction = {
  id: string;
  leadId: string;
  type: InteractionType;
  title: string;
  summary: string;
  createdAt: string;
  actor: string;
};

export type CrmTask = {
  id: string;
  leadId: string;
  title: string;
  status: CrmTaskStatus;
  dueLabel: string;
  detail?: string;
  href?: string;
  entityType?: "lead" | "rental_request" | "unmatched_reply";
};

export type CrmRevenuePoint = {
  month: string;
  value: number;
};

export type CrmSourceMetric = {
  source: LeadSource;
  leads: number;
  booked: number;
  rate: number;
};

export type LeadTemperature = "hot" | "warm" | "cold";

export type TeamPerformanceMetric = {
  name: string;
  leadsAssigned: number;
  quotesSent: number;
  bookings: number;
  revenueClosed: number;
  averageResponseHours: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  count: number;
};

export type LostReasonMetric = {
  reason: NonNullable<CrmLead["lostReason"]>;
  count: number;
};

export type CrmLeadFilters = {
  q?: string;
  stage?: string;
  eventType?: string;
  source?: string;
  owner?: string;
  nextAction?: string;
  dateRange?: string;
  followUp?: string;
};

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new_inquiry: "New Inquiry",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  consultation_completed: "Consultation Completed",
  quote_sent: "Quote Sent",
  awaiting_deposit: "Awaiting Deposit",
  booked: "Booked",
  lost: "Lost",
};

export const crmLeads: CrmLead[] = [
  {
    id: "lead-park-ju",
    clientName: "Park Ju",
    email: "parkju@gmail.com",
    phone: "7373848",
    eventType: "Wedding",
    eventDate: "2026-09-06",
    venue: "The Swan House",
    stage: "quote_sent",
    estimatedValue: 5750,
    lastContact: "2026-04-12T10:30:00Z",
    nextFollowUp: "2026-04-15",
    owner: "Biniam",
    source: "Website",
    budgetRange: "$5k – $8k",
    quoteSummary: "Signature floral and ceremony styling proposal sent.",
    paymentSummary: "Deposit not yet paid.",
    notes: ["Requested romantic white florals.", "Needs final venue access window confirmed."],
    contractStatus: "sent",
    paymentStatus: "deposit_due",
    decorStatus: "approved",
  },
  {
    id: "lead-ysakor",
    clientName: "Ysakor Araia",
    email: "ysakor@gmail.com",
    phone: "74845895959",
    eventType: "Wedding",
    eventDate: "2026-06-05",
    venue: "The Stave Room",
    stage: "new_inquiry",
    estimatedValue: 5750,
    lastContact: "2026-04-11T18:00:00Z",
    nextFollowUp: "2026-04-13",
    owner: "Biniam",
    source: "Instagram",
    budgetRange: "$5k – $7k",
    quoteSummary: "Consultation not yet scheduled.",
    paymentSummary: "No payment activity.",
    notes: ["Interested in soft glam tablescape.", "Asked for portfolio examples."],
    contractStatus: "unsigned",
    paymentStatus: "unpaid",
    decorStatus: "pending",
  },
  {
    id: "lead-biniam",
    clientName: "Biniam Kiros",
    email: "biniam@gmail.com",
    phone: "63637737",
    eventType: "Wedding",
    eventDate: "2026-07-25",
    venue: "The Foundry at Puritan Mill",
    stage: "awaiting_deposit",
    estimatedValue: 8000,
    lastContact: "2026-04-10T13:00:00Z",
    nextFollowUp: "2026-04-14",
    owner: "Contracts Desk",
    source: "Referral",
    budgetRange: "$8k – $12k",
    quoteSummary: "Quote accepted, contract out for signature.",
    paymentSummary: "Deposit invoice open.",
    notes: ["Client asked to split floral and candle package."],
    contractStatus: "sent",
    paymentStatus: "deposit_due",
    decorStatus: "in_progress",
  },
  {
    id: "lead-abeba",
    clientName: "Abeba Amare",
    email: "abeba@gmail.com",
    phone: "77484949",
    eventType: "Traditional",
    eventDate: "2026-07-12",
    venue: "Atlanta History Center",
    stage: "consultation_scheduled",
    estimatedValue: 8250,
    lastContact: "2026-04-12T08:00:00Z",
    nextFollowUp: "2026-04-16",
    owner: "Biniam",
    source: "Vendor Partner",
    budgetRange: "$8k – $10k",
    quoteSummary: "Consultation booked for Friday.",
    paymentSummary: "No payment activity.",
    notes: ["Traditional entrance and sweetheart styling prioritized."],
    contractStatus: "unsigned",
    paymentStatus: "unpaid",
    decorStatus: "pending",
  },
  {
    id: "lead-hana",
    clientName: "Hana Bekele",
    email: "hana@gmail.com",
    phone: "77711122",
    eventType: "Corporate",
    eventDate: "2026-05-19",
    venue: "Porsche Experience Center",
    stage: "booked",
    estimatedValue: 14000,
    lastContact: "2026-04-09T11:30:00Z",
    nextFollowUp: "2026-04-20",
    owner: "Operations",
    source: "Returning Client",
    budgetRange: "$12k+",
    quoteSummary: "Booked premium reception environment.",
    paymentSummary: "Deposit received.",
    notes: ["Branded stage and hospitality lounge approved."],
    contractStatus: "signed",
    paymentStatus: "deposit_paid",
    decorStatus: "ready",
  },
  {
    id: "lead-selam",
    clientName: "Selam Desta",
    email: "selam@gmail.com",
    phone: "77733344",
    eventType: "Engagement",
    eventDate: "2026-08-14",
    venue: "Ventanas",
    stage: "consultation_completed",
    estimatedValue: 6200,
    lastContact: "2026-04-10T10:00:00Z",
    nextFollowUp: "2026-04-15",
    owner: "Biniam",
    source: "Referral",
    budgetRange: "$6k – $8k",
    quoteSummary: "Consultation completed, quote draft in progress.",
    paymentSummary: "No payment activity.",
    notes: ["Wants a clean monochrome floral look."],
    contractStatus: "unsigned",
    paymentStatus: "unpaid",
    decorStatus: "pending",
  },
  {
    id: "lead-liya",
    clientName: "Liya Meles",
    email: "liya@gmail.com",
    phone: "77755566",
    eventType: "Wedding",
    eventDate: "2026-10-09",
    venue: "The Estate",
    stage: "lost",
    estimatedValue: 9200,
    lastContact: "2026-04-01T09:30:00Z",
    nextFollowUp: "2026-04-02",
    owner: "Contracts Desk",
    source: "Website",
    budgetRange: "$8k – $10k",
    quoteSummary: "Quote declined after competitive comparison.",
    paymentSummary: "No payment activity.",
    notes: ["Loved the floral concept but paused budget."],
    contractStatus: "unsigned",
    paymentStatus: "unpaid",
    decorStatus: "pending",
    lostReason: "Price too high",
  },
];

export const crmInteractions: CrmInteraction[] = [
  {
    id: "i1",
    leadId: "lead-park-ju",
    type: "quote",
    title: "Quote sent",
    summary: "Signature proposal delivered with revised delivery fee.",
    createdAt: "2026-04-12T14:00:00Z",
    actor: "Biniam",
  },
  {
    id: "i2",
    leadId: "lead-abeba",
    type: "consultation",
    title: "Consultation scheduled",
    summary: "Friday consultation booked to finalize traditional setup scope.",
    createdAt: "2026-04-12T09:30:00Z",
    actor: "Biniam",
  },
  {
    id: "i3",
    leadId: "lead-biniam",
    type: "email",
    title: "Deposit reminder sent",
    summary: "Follow-up email sent with deposit invoice and due date reminder.",
    createdAt: "2026-04-11T17:15:00Z",
    actor: "Contracts Desk",
  },
  {
    id: "i4",
    leadId: "lead-hana",
    type: "payment",
    title: "Deposit received",
    summary: "Initial deposit posted and booking confirmed.",
    createdAt: "2026-04-11T12:00:00Z",
    actor: "Finance",
  },
  {
    id: "i5",
    leadId: "lead-ysakor",
    type: "note",
    title: "New inquiry reviewed",
    summary: "Lead marked hot after Instagram DM follow-up.",
    createdAt: "2026-04-11T10:20:00Z",
    actor: "Biniam",
  },
];

export const crmTasks: CrmTask[] = [
  { id: "t1", leadId: "lead-ysakor", title: "Schedule consultation", status: "overdue", dueLabel: "1 day overdue" },
  { id: "t2", leadId: "lead-park-ju", title: "Quote follow-up", status: "today", dueLabel: "Due today" },
  { id: "t3", leadId: "lead-abeba", title: "Awaiting client inspiration board", status: "awaiting_reply", dueLabel: "Awaiting reply" },
  { id: "t4", leadId: "lead-biniam", title: "Collect deposit", status: "deposit", dueLabel: "Deposit unpaid" },
  { id: "t5", leadId: "lead-biniam", title: "Contract signature reminder", status: "contract", dueLabel: "Unsigned contract" },
];

export const crmRevenueTrend: CrmRevenuePoint[] = [
  { month: "Nov", value: 18000 },
  { month: "Dec", value: 22500 },
  { month: "Jan", value: 19500 },
  { month: "Feb", value: 26800 },
  { month: "Mar", value: 31400 },
  { month: "Apr", value: 28750 },
];

export const crmSourceMetrics: CrmSourceMetric[] = [
  { source: "Website", leads: 18, booked: 4, rate: 22 },
  { source: "Referral", leads: 10, booked: 4, rate: 40 },
  { source: "Instagram", leads: 8, booked: 1, rate: 13 },
  { source: "Returning Client", leads: 4, booked: 2, rate: 50 },
  { source: "Vendor Partner", leads: 6, booked: 2, rate: 33 },
];

export const crmTeamPerformance: TeamPerformanceMetric[] = [
  { name: "Biniam", leadsAssigned: 4, quotesSent: 2, bookings: 1, revenueClosed: 14000, averageResponseHours: 5.2 },
  { name: "Contracts Desk", leadsAssigned: 2, quotesSent: 2, bookings: 0, revenueClosed: 0, averageResponseHours: 8.6 },
  { name: "Operations", leadsAssigned: 1, quotesSent: 0, bookings: 1, revenueClosed: 14000, averageResponseHours: 12.4 },
];

export const crmDashboardAlerts: DashboardAlert[] = [
  { id: "alert-1", title: "Leads not contacted", detail: "New inquiries waiting beyond 24 hours.", severity: "high", count: 2 },
  { id: "alert-2", title: "Overdue follow-ups", detail: "Leads that need immediate follow-up.", severity: "high", count: 1 },
  { id: "alert-3", title: "Quotes awaiting response", detail: "Clients still pending decision on sent quotes.", severity: "medium", count: 1 },
  { id: "alert-4", title: "Unsigned contracts", detail: "Accepted scope without signature completion.", severity: "medium", count: 2 },
  { id: "alert-5", title: "Deposits overdue", detail: "Open deposit obligations blocking full booking progress.", severity: "high", count: 2 },
  { id: "alert-6", title: "Upcoming consultations", detail: "Scheduled consultations in the next seven days.", severity: "low", count: 1 },
];

export const crmLostReasonMetrics: LostReasonMetric[] = [
  { reason: "Price too high", count: 2 },
  { reason: "Chose competitor", count: 1 },
  { reason: "No response", count: 1 },
  { reason: "Date unavailable", count: 0 },
  { reason: "Not ready", count: 1 },
  { reason: "Other", count: 0 },
];

export function getCrmLeadById(id: string) {
  return crmLeads.find((lead) => lead.id === id) ?? null;
}

export function filterCrmLeads(leads: CrmLead[], filters: CrmLeadFilters) {
  return leads.filter((lead) => {
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const haystack = `${lead.clientName} ${lead.email} ${lead.venue}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.eventType && lead.eventType !== filters.eventType) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.owner && lead.owner !== filters.owner) return false;
    if (filters.nextAction === "set" && !lead.nextAction?.trim()) return false;
    if (filters.nextAction === "none" && lead.nextAction?.trim()) return false;
    if (filters.nextAction === "overdue") {
      if (!lead.nextActionDueAt) return false;
      if (new Date(lead.nextActionDueAt).getTime() >= Date.now()) return false;
    }
    if (filters.followUp === "with_inspiration" && !lead.hasFollowUpInspiration) return false;
    if (filters.dateRange) {
      const days = Number(filters.dateRange);
      const diff = (new Date(lead.eventDate).getTime() - Date.now()) / 86400000;
      if (Number.isFinite(days) && diff > days) return false;
    }
    return true;
  });
}

export function getLeadInteractions(leadId: string) {
  return crmInteractions
    .filter((item) => item.leadId === leadId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getLeadTasks(leadId: string) {
  return crmTasks.filter((task) => task.leadId === leadId);
}

export function getLeadTemperature(lead: CrmLead): LeadTemperature {
  return lead.leadTemperature ?? "cold";
}

export function getLeadProbability(lead: CrmLead) {
  if (typeof lead.leadScore === "number" && Number.isFinite(lead.leadScore)) {
    const normalized = Math.max(0.1, Math.min(0.95, lead.leadScore / 100));
    return Number(normalized.toFixed(2));
  }
  const temperature = getLeadTemperature(lead);
  if (temperature === "hot") return 0.8;
  if (temperature === "warm") return 0.5;
  return 0.2;
}

export function sortCrmLeadsByActionReadiness(
  leads: CrmLead[],
  options?: {
    revisionLeadIds?: Set<string>;
    unmatchedReplyCandidateCounts?: Record<string, number>;
  }
) {
  const now = Date.now();
  const stagePriority: Record<CrmStage, number> = {
    new_inquiry: 5,
    contacted: 6,
    consultation_scheduled: 7,
    consultation_completed: 4,
    quote_sent: 3,
    awaiting_deposit: 2,
    booked: 8,
    lost: 9,
  };

  function getDueTimestamp(value: string | null | undefined) {
    if (!value) return Number.POSITIVE_INFINITY;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
  }

  function getPriority(lead: CrmLead) {
    const dueTimestamp = getDueTimestamp(lead.nextActionDueAt);
    const hasOverdueAction = dueTimestamp < now;
    const needsRevision = options?.revisionLeadIds?.has(lead.id) ?? false;
    const hasUnmatchedReply = (options?.unmatchedReplyCandidateCounts?.[lead.id] ?? 0) > 0;
    const hasFollowUpInspiration = lead.hasFollowUpInspiration ?? false;

    if (hasOverdueAction) return 0;
    if (needsRevision) return 1;
    if (hasUnmatchedReply) return 2;
    if (hasFollowUpInspiration) return 3;
    return stagePriority[lead.stage] ?? 10;
  }

  return [...leads].sort((a, b) => {
    const priorityDiff = getPriority(a) - getPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const dueDiff = getDueTimestamp(a.nextActionDueAt) - getDueTimestamp(b.nextActionDueAt);
    if (Number.isFinite(dueDiff) && dueDiff !== 0) return dueDiff;

    const eventDiff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    if (Number.isFinite(eventDiff) && eventDiff !== 0) return eventDiff;

    return new Date(b.createdAt ?? b.lastContact).getTime() - new Date(a.createdAt ?? a.lastContact).getTime();
  });
}

export function getPipelineValue(leads: CrmLead[]) {
  return leads
    .filter((lead) => lead.stage !== "lost")
    .reduce((sum, lead) => sum + lead.estimatedValue, 0);
}

export function getBookedRevenue(leads: CrmLead[]) {
  return leads
    .filter((lead) => lead.stage === "booked")
    .reduce((sum, lead) => sum + lead.estimatedValue, 0);
}

export function getForecastedRevenue(leads: CrmLead[]) {
  // TODO: replace weighted mock forecast with live CRM scoring inputs from budget, responsiveness, consultation status, and quote status.
  return Math.round(
    leads
      .filter((lead) => lead.stage !== "lost")
      .reduce((sum, lead) => sum + lead.estimatedValue * getLeadProbability(lead), 0)
  );
}

export function getLikelyRevenue(leads: CrmLead[]) {
  return Math.round(
    leads
      .filter((lead) => getLeadTemperature(lead) === "hot")
      .reduce((sum, lead) => sum + lead.estimatedValue * 0.8, 0)
  );
}

export function getPipelineStageCounts(leads: CrmLead[]) {
  return Object.entries(CRM_STAGE_LABELS).map(([stage, label]) => ({
    stage: stage as CrmStage,
    label,
    count: leads.filter((lead) => lead.stage === stage).length,
  }));
}

export function getSourceMetrics(leads: CrmLead[]): CrmSourceMetric[] {
  const sources: LeadSource[] = [
    "Website",
    "Instagram",
    "Referral",
    "Vendor Partner",
    "Returning Client",
  ];

  return sources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const booked = sourceLeads.filter((lead) => lead.stage === "booked").length;
    const leadsCount = sourceLeads.length;
    return {
      source,
      leads: leadsCount,
      booked,
      rate: leadsCount ? Math.round((booked / leadsCount) * 100) : 0,
    };
  });
}

export function getLostReasonMetrics(leads: CrmLead[]): LostReasonMetric[] {
  const reasons: LostReasonMetric["reason"][] = [
    "Price too high",
    "Chose competitor",
    "No response",
    "Date unavailable",
    "Not ready",
    "Other",
  ];

  return reasons.map((reason) => ({
    reason,
    count: leads.filter((lead) => lead.stage === "lost" && lead.lostReason === reason).length,
  }));
}

export function getConversionRate(leads: CrmLead[]) {
  if (!leads.length) return 0;
  return Math.round((leads.filter((lead) => lead.stage === "booked").length / leads.length) * 100);
}

export function getAverageEventValue(leads: CrmLead[]) {
  const active = leads.filter((lead) => lead.stage !== "lost");
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, lead) => sum + lead.estimatedValue, 0) / active.length);
}

export function getOutstandingBalances(leads: CrmLead[]) {
  return Math.round(
    leads
      .filter((lead) => lead.paymentStatus === "deposit_due" || lead.stage === "quote_sent" || lead.stage === "awaiting_deposit")
      .reduce((sum, lead) => sum + lead.estimatedValue * 0.3, 0)
  );
}
