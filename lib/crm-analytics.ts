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
  source: LeadSource;
  budgetRange: string;
  quoteSummary: string;
  paymentSummary: string;
  notes: string[];
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

export function getCrmLeadById(id: string) {
  return crmLeads.find((lead) => lead.id === id) ?? null;
}

export function getLeadInteractions(leadId: string) {
  return crmInteractions
    .filter((item) => item.leadId === leadId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getLeadTasks(leadId: string) {
  return crmTasks.filter((task) => task.leadId === leadId);
}
