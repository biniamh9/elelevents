import type { SupabaseClient } from "@supabase/supabase-js";
import { deriveBookingStage } from "@/lib/booking-lifecycle";
import {
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLikelyRevenue,
  getPipelineStageCounts,
  getPipelineValue,
  type CrmInteraction,
  type CrmLead,
  type CrmRevenuePoint,
  type CrmStage,
  type CrmTask,
  type DashboardAlert,
  type InteractionType,
  type LeadSource,
  type TeamPerformanceMetric,
} from "@/lib/crm-analytics";
import {
  inquiryFollowUpNeedsReview,
  normalizeInquiryFollowUpDetails,
} from "@/lib/inquiry-follow-up";
import { isCrmLeadTemperature, isCrmLostReason } from "@/lib/crm-options";

type InquiryRow = {
  id: string;
  client_id: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
  status: string | null;
  booking_stage: string | null;
  estimated_price: number | null;
  consultation_status: string | null;
  consultation_at: string | null;
  quote_response_status: string | null;
  follow_up_at: string | null;
  follow_up_details_json: unknown;
  inspiration_notes: string | null;
  additional_info: string | null;
  colors_theme: string | null;
  admin_notes: string | null;
  crm_owner: string | null;
  crm_next_action: string | null;
  crm_next_action_due_at: string | null;
  crm_lead_score: number | null;
  crm_lead_temperature: string | null;
  lost_reason: string | null;
  crm_lost_at: string | null;
  crm_lost_context: string | null;
  referral_source: string | null;
  guest_count: number | null;
  booked_at: string | null;
  reserved_at: string | null;
  completed_at: string | null;
  floor_plan_received: boolean | null;
  walkthrough_completed: boolean | null;
};

type ContractRow = {
  id: string;
  inquiry_id: string | null;
  contract_status: string | null;
  contract_total: number | null;
  deposit_amount: number | null;
  balance_due: number | null;
  deposit_paid: boolean | null;
  deposit_paid_at: string | null;
  signed_at: string | null;
  closed_at: string | null;
  balance_due_date: string | null;
};

type InteractionRow = {
  id: string;
  inquiry_id: string | null;
  subject: string | null;
  body_text: string;
  created_at: string;
  channel: string | null;
  direction: string | null;
  provider: string | null;
};

type ActivityRow = {
  id: string;
  entity_id: string;
  action: string;
  summary: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type TaskRow = {
  id: string;
  inquiry_id: string;
  title: string;
  detail: string | null;
  task_kind: string;
  status: "open" | "completed";
  due_at: string | null;
  created_at: string;
  owner_name: string | null;
};

type SnapshotOptions = {
  inquiryId?: string;
};

export type LiveCrmSnapshot = {
  leads: CrmLead[];
  interactions: CrmInteraction[];
  tasks: CrmTask[];
  revenueTrend: CrmRevenuePoint[];
  teamPerformance: TeamPerformanceMetric[];
  dashboardAlerts: DashboardAlert[];
  followUpSummary: {
    pending: number;
    reviewed: number;
  };
};

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function formatName(firstName: string | null, lastName: string | null) {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full || "Unnamed client";
}

function truncateCopy(value: string | null | undefined, max = 120) {
  const text = value?.trim() ?? "";
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function normalizeSource(value: string | null | undefined): LeadSource {
  const source = (value ?? "").trim().toLowerCase();
  if (source.includes("insta")) return "Instagram";
  if (source.includes("refer")) return "Referral";
  if (source.includes("vendor") || source.includes("partner")) return "Vendor Partner";
  if (source.includes("return")) return "Returning Client";
  return "Website";
}

function humanizeLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapActivityType(action: string): InteractionType {
  const haystack = action.toLowerCase();
  if (haystack.includes("payment") || haystack.includes("deposit") || haystack.includes("receipt")) return "payment";
  if (haystack.includes("quote") || haystack.includes("proposal")) return "quote";
  if (haystack.includes("consultation")) return "consultation";
  if (haystack.includes("email")) return "email";
  if (haystack.includes("call")) return "call";
  return "note";
}

function mapInteractionType(channel: string | null | undefined, subject: string | null | undefined): InteractionType {
  const haystack = `${channel ?? ""} ${subject ?? ""}`.toLowerCase();
  if (haystack.includes("consultation") || haystack.includes("meeting")) return "consultation";
  if (haystack.includes("call") || channel === "phone") return "call";
  if (haystack.includes("payment") || haystack.includes("deposit")) return "payment";
  if (haystack.includes("quote") || haystack.includes("proposal")) return "quote";
  if (channel === "email") return "email";
  return "note";
}

function mapCrmStage(inquiry: InquiryRow, contract: ContractRow | null): CrmStage {
  if (inquiry.status === "closed_lost" || inquiry.quote_response_status === "declined") {
    return "lost";
  }

  const bookingStage = deriveBookingStage({
    bookingStage: inquiry.booking_stage,
    inquiryStatus: inquiry.status,
    consultationStatus: inquiry.consultation_status,
    quoteResponseStatus: inquiry.quote_response_status,
    contractStatus: contract?.contract_status,
    depositPaid: contract?.deposit_paid,
    completedAt: inquiry.completed_at,
  });

  if (bookingStage === "completed" || bookingStage === "reserved" || bookingStage === "signed_deposit_paid") {
    return "booked";
  }
  if (bookingStage === "contract_sent") {
    return "awaiting_deposit";
  }
  if (bookingStage === "quote_sent") {
    return "quote_sent";
  }
  if (bookingStage === "consultation_scheduled") {
    return inquiry.consultation_status === "completed"
      ? "consultation_completed"
      : "consultation_scheduled";
  }
  if (inquiry.status === "contacted") {
    return "contacted";
  }
  return "new_inquiry";
}

function getContractStatus(contract: ContractRow | null): CrmLead["contractStatus"] {
  if (!contract || !contract.contract_status || contract.contract_status === "draft") return "unsigned";
  if (contract.contract_status === "signed" || contract.contract_status === "deposit_paid" || contract.contract_status === "closed") {
    return "signed";
  }
  return "sent";
}

function getOutstandingBalance(inquiry: InquiryRow, contract: ContractRow | null, stage: CrmStage) {
  if (contract) {
    if (contract.deposit_paid) {
      return Math.max(toNumber(contract.balance_due, 0), 0);
    }
    if (toNumber(contract.deposit_amount, 0) > 0) {
      return Math.max(toNumber(contract.deposit_amount, 0), 0);
    }
    return Math.max(toNumber(contract.balance_due, 0), 0);
  }

  if (stage === "quote_sent" || stage === "awaiting_deposit") {
    return Math.round(toNumber(inquiry.estimated_price, 0) * 0.3);
  }

  return 0;
}

function getPaymentStatus(
  contract: ContractRow | null,
  outstandingBalance: number
): CrmLead["paymentStatus"] {
  if (!contract) return "unpaid";
  if (contract.deposit_paid && outstandingBalance <= 0) return "paid";
  if (contract.deposit_paid) return "deposit_paid";
  if (toNumber(contract.deposit_amount, 0) > 0 || outstandingBalance > 0) return "deposit_due";
  return "unpaid";
}

function getDecorStatus(inquiry: InquiryRow, stage: CrmStage): CrmLead["decorStatus"] {
  if (stage === "booked" && inquiry.walkthrough_completed) return "ready";
  if (stage === "booked" && inquiry.floor_plan_received) return "approved";
  if (["quote_sent", "awaiting_deposit", "booked"].includes(stage)) return "in_progress";
  return "pending";
}

function getQuoteSummary(stage: CrmStage, inquiry: InquiryRow, contract: ContractRow | null) {
  if (inquiry.quote_response_status === "changes_requested") {
    return "Client requested changes to the current proposal.";
  }
  if (inquiry.quote_response_status === "accepted") {
    return contract ? "Proposal approved and contract is in progress." : "Proposal approved by client.";
  }
  if (inquiry.quote_response_status === "awaiting_response" || stage === "quote_sent") {
    return "Proposal sent and awaiting client response.";
  }
  if (stage === "consultation_completed") {
    return "Consultation complete and proposal drafting is next.";
  }
  if (stage === "consultation_scheduled") {
    return "Consultation scheduled before proposal preparation.";
  }
  if (stage === "awaiting_deposit") {
    return "Quote accepted and moving through contract and deposit steps.";
  }
  if (stage === "booked") {
    return "Scope approved and event is booked.";
  }
  if (stage === "lost") {
    return "Opportunity closed without booking.";
  }
  return "Lead is still in early qualification.";
}

function getPaymentSummary(paymentStatus: CrmLead["paymentStatus"], outstandingBalance: number) {
  if (paymentStatus === "paid") return "All current payment milestones are satisfied.";
  if (paymentStatus === "deposit_paid") {
    return outstandingBalance > 0
      ? `Deposit collected. Remaining balance: $${outstandingBalance.toLocaleString()}.`
      : "Deposit collected.";
  }
  if (paymentStatus === "deposit_due") {
    return `Outstanding payment due: $${outstandingBalance.toLocaleString()}.`;
  }
  return "No payment activity yet.";
}

function getBudgetRange(inquiry: InquiryRow, estimatedValue: number) {
  if (estimatedValue >= 12000) return "$12k+";
  if (estimatedValue >= 8000) return "$8k – $12k";
  if (estimatedValue >= 5000) return "$5k – $8k";
  if (estimatedValue > 0) return "Under $5k";
  if ((inquiry.additional_info ?? "").toLowerCase().includes("budget")) {
    return "Shared in notes";
  }
  return "Not set";
}

function getOwner(inquiry: Pick<InquiryRow, "crm_owner">) {
  const persistedOwner = inquiry.crm_owner?.trim();
  return persistedOwner || "Unassigned";
}

function getFirstResponseHours(createdAt: string, timestamps: string[]) {
  const createdMs = new Date(createdAt).getTime();
  const firstResponse = timestamps
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value) && value >= createdMs)
    .sort((a, b) => a - b)[0];

  if (!firstResponse) return null;
  return Number(((firstResponse - createdMs) / 3600000).toFixed(1));
}

function buildLeadNotes(inquiry: InquiryRow) {
  return compact([
    inquiry.colors_theme ? `Palette: ${truncateCopy(inquiry.colors_theme, 90)}` : null,
    inquiry.inspiration_notes ? `Vision: ${truncateCopy(inquiry.inspiration_notes, 110)}` : null,
    inquiry.additional_info ? `Additional info: ${truncateCopy(inquiry.additional_info, 110)}` : null,
    inquiry.admin_notes ? `Admin note: ${truncateCopy(inquiry.admin_notes, 110)}` : null,
  ]).slice(0, 4);
}

function mapPersistedTaskStatus(task: TaskRow): CrmTask["status"] {
  if (task.task_kind === "deposit_followup") return "deposit";
  if (task.task_kind === "quote_approval" || task.task_kind === "contract_followup") return "contract";
  const dueAt = task.due_at ? new Date(task.due_at).getTime() : null;
  if (!dueAt) return "today";
  if (dueAt < Date.now()) return "overdue";
  if (dueAt - Date.now() < 86400000) return "today";
  return "awaiting_reply";
}

function buildTaskDueLabel(task: TaskRow): string {
  if (task.task_kind === "deposit_followup") return "Deposit follow-up";
  if (task.task_kind === "quote_changes") return "Quote revision requested";
  if (task.task_kind === "quote_approval") return "Quote approval follow-up";
  if (task.task_kind === "contract_followup") return "Unsigned contract";
  if (!task.due_at) return "Follow-up needed";
  const dueDate = new Date(task.due_at);
  const diffDays = Math.round((dueDate.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)} day overdue`;
  if (diffDays === 0) return "Due today";
  return `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function buildDerivedTasks(leads: CrmLead[], persistedTasks: CrmTask[]) {
  const existingKeys = new Set(
    persistedTasks.map((task) => `${task.leadId}:${task.title.toLowerCase()}`)
  );

  const tasks: CrmTask[] = [];

  for (const lead of leads) {
    const addTask = (title: string, status: CrmTask["status"], detail: string, dueLabel: string) => {
      const key = `${lead.id}:${title.toLowerCase()}`;
      if (existingKeys.has(key)) return;
      tasks.push({
        id: `derived-${lead.id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        leadId: lead.id,
        title,
        status,
        dueLabel,
        detail,
      });
    };

    if (lead.hasFollowUpInspiration) {
      addTask(
        "Review follow-up inspiration",
        "today",
        `${lead.clientName} added post-submission inspiration.`,
        "Inspiration review pending"
      );
    }

    if (lead.stage === "new_inquiry") {
      const hoursOpen = lead.createdAt ? (Date.now() - new Date(lead.createdAt).getTime()) / 3600000 : 0;
      addTask(
        "Make first contact",
        hoursOpen > 24 ? "overdue" : "today",
        `${lead.clientName} has not been actively worked yet.`,
        hoursOpen > 24 ? "First response overdue" : "Due today"
      );
    }

    if (lead.stage === "consultation_completed") {
      addTask(
        "Build quote draft",
        "today",
        `${lead.clientName} is ready for proposal preparation.`,
        "Proposal drafting next"
      );
    }

    if (lead.quoteResponseStatus === "changes_requested") {
      addTask(
        "Revise quote",
        "today",
        `${lead.clientName} requested proposal changes.`,
        "Client requested revisions"
      );
    } else if (lead.stage === "quote_sent") {
      addTask(
        "Quote follow-up",
        "awaiting_reply",
        `${lead.clientName} is reviewing the current proposal.`,
        "Awaiting client reply"
      );
    }

    if (lead.stage === "awaiting_deposit" && lead.contractStatus !== "signed") {
      addTask(
        "Contract signature reminder",
        "contract",
        `${lead.clientName} still needs to finalize the contract.`,
        "Unsigned contract"
      );
    }

    if (lead.stage === "awaiting_deposit" && lead.paymentStatus === "deposit_due") {
      addTask(
        "Collect deposit",
        "deposit",
        `${lead.clientName} still has an open deposit milestone.`,
        "Deposit unpaid"
      );
    }
  }

  return tasks;
}

export function buildRevenueTrend(leads: CrmLead[]): CrmRevenuePoint[] {
  const months: CrmRevenuePoint[] = [];
  const monthStarts: Date[] = [];
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let index = 5; index >= 0; index -= 1) {
    const month = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - index, 1));
    monthStarts.push(month);
    months.push({
      month: month.toLocaleDateString("en-US", { month: "short" }),
      value: 0,
    });
  }

  for (const lead of leads) {
    if (lead.stage !== "booked") continue;
    const bookedAt = lead.bookedAt ? new Date(lead.bookedAt) : null;
    if (!bookedAt || Number.isNaN(bookedAt.getTime())) continue;
    const monthKey = Date.UTC(bookedAt.getUTCFullYear(), bookedAt.getUTCMonth(), 1);
    const index = monthStarts.findIndex((month) => month.getTime() === monthKey);
    if (index >= 0) {
      months[index].value += lead.estimatedValue;
    }
  }

  return months;
}

export function buildTeamPerformance(leads: CrmLead[]): TeamPerformanceMetric[] {
  const owners = new Map<
    string,
    TeamPerformanceMetric & {
      responseSamples: number;
      responseTotal: number;
    }
  >();

  for (const lead of leads) {
    const owner = lead.owner || "Unassigned";
    const existing =
      owners.get(owner) ??
      {
        name: owner,
        leadsAssigned: 0,
        quotesSent: 0,
        bookings: 0,
        revenueClosed: 0,
        averageResponseHours: 0,
        responseSamples: 0,
        responseTotal: 0,
      };

    existing.leadsAssigned += 1;
    if (lead.stage === "quote_sent" || lead.stage === "awaiting_deposit" || lead.stage === "booked") {
      existing.quotesSent += 1;
    }
    if (lead.stage === "booked") {
      existing.bookings += 1;
      existing.revenueClosed += lead.estimatedValue;
    }

    if (lead.firstResponseHours !== null && lead.firstResponseHours !== undefined) {
      existing.responseSamples += 1;
      existing.responseTotal += lead.firstResponseHours;
      existing.averageResponseHours = Number(
        (existing.responseTotal / existing.responseSamples).toFixed(1)
      );
    }

    owners.set(owner, existing);
  }

  return [...owners.values()]
    .map(({ responseSamples: _responseSamples, responseTotal: _responseTotal, ...metric }) => metric)
    .sort((a, b) => b.revenueClosed - a.revenueClosed || b.leadsAssigned - a.leadsAssigned);
}

export function buildDashboardAlerts(leads: CrmLead[], tasks: CrmTask[]): DashboardAlert[] {
  const upcomingConsultations = leads.filter((lead) => {
    if (lead.stage !== "consultation_scheduled" || !lead.consultationAt) return false;
    const consultationAt = new Date(lead.consultationAt).getTime();
    const diff = consultationAt - Date.now();
    return diff >= 0 && diff <= 7 * 86400000;
  }).length;

  return [
    {
      id: "crm-alert-new",
      title: "Leads not contacted",
      detail: "New inquiries still waiting for first active follow-up.",
      severity: "high",
      count: leads.filter((lead) => lead.stage === "new_inquiry").length,
    },
    {
      id: "crm-alert-overdue",
      title: "Overdue follow-ups",
      detail: "Open CRM tasks that are already overdue.",
      severity: "high",
      count: tasks.filter((task) => task.status === "overdue").length,
    },
    {
      id: "crm-alert-quotes",
      title: "Quotes awaiting response",
      detail: "Clients still reviewing sent proposals.",
      severity: "medium",
      count: leads.filter((lead) => lead.stage === "quote_sent").length,
    },
    {
      id: "crm-alert-contracts",
      title: "Unsigned contracts",
      detail: "Contracts are out but not fully secured yet.",
      severity: "medium",
      count: leads.filter((lead) => lead.stage === "awaiting_deposit" && lead.contractStatus !== "signed").length,
    },
    {
      id: "crm-alert-deposits",
      title: "Deposits overdue",
      detail: "Deposit collection is still open on active bookings.",
      severity: "high",
      count: leads.filter((lead) => lead.paymentStatus === "deposit_due").length,
    },
    {
      id: "crm-alert-consultations",
      title: "Upcoming consultations",
      detail: "Consultations scheduled in the next seven days.",
      severity: "low",
      count: upcomingConsultations,
    },
  ];
}

function buildInteractionSummary(row: InteractionRow) {
  const summary = truncateCopy(row.body_text, 120);
  if (summary) return summary;
  if (row.direction === "inbound") return "Client reply received.";
  if (row.direction === "outbound") return "Outbound email delivered.";
  return "Customer interaction recorded.";
}

async function fetchSnapshotContext(supabase: SupabaseClient, options: SnapshotOptions) {
  let inquiryQuery = supabase
    .from("event_inquiries")
    .select(
      "id, client_id, created_at, first_name, last_name, email, phone, event_type, event_date, venue_name, status, booking_stage, estimated_price, consultation_status, consultation_at, quote_response_status, follow_up_at, follow_up_details_json, inspiration_notes, additional_info, colors_theme, admin_notes, crm_owner, crm_next_action, crm_next_action_due_at, crm_lead_score, crm_lead_temperature, lost_reason, crm_lost_at, crm_lost_context, referral_source, guest_count, booked_at, reserved_at, completed_at, floor_plan_received, walkthrough_completed"
    )
    .order("created_at", { ascending: false });

  if (options.inquiryId) {
    inquiryQuery = inquiryQuery.eq("id", options.inquiryId);
  } else {
    inquiryQuery = inquiryQuery.neq("status", "archived");
  }

  const { data: inquiries, error: inquiryError } = await inquiryQuery;

  if (inquiryError) {
    throw new Error(inquiryError.message);
  }

  const inquiryRows = (inquiries ?? []) as InquiryRow[];
  const inquiryIds = inquiryRows.map((row) => row.id);

  if (!inquiryIds.length) {
    return {
      inquiries: [],
      contracts: [],
      customerInteractions: [],
      activities: [],
      tasks: [],
    };
  }

  const [
    contractsResult,
    customerInteractionsResult,
    activityResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        "id, inquiry_id, contract_status, contract_total, deposit_amount, balance_due, deposit_paid, deposit_paid_at, signed_at, closed_at, balance_due_date"
      )
      .in("inquiry_id", inquiryIds),
    supabase
      .from("customer_interactions")
      .select("id, inquiry_id, subject, body_text, created_at, channel, direction, provider")
      .in("inquiry_id", inquiryIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id, entity_id, action, summary, created_at, metadata")
      .eq("entity_type", "inquiry")
      .in("entity_id", inquiryIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("crm_follow_up_tasks")
      .select("id, inquiry_id, title, detail, task_kind, status, due_at, created_at, owner_name")
      .in("inquiry_id", inquiryIds)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  if (contractsResult.error) throw new Error(contractsResult.error.message);
  if (customerInteractionsResult.error) throw new Error(customerInteractionsResult.error.message);
  if (activityResult.error) throw new Error(activityResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);

  return {
    inquiries: inquiryRows,
    contracts: (contractsResult.data ?? []) as ContractRow[],
    customerInteractions: (customerInteractionsResult.data ?? []) as InteractionRow[],
    activities: (activityResult.data ?? []) as ActivityRow[],
    tasks: (tasksResult.data ?? []) as TaskRow[],
  };
}

export async function getLiveCrmSnapshot(
  supabase: SupabaseClient,
  options: SnapshotOptions = {}
): Promise<LiveCrmSnapshot> {
  const context = await fetchSnapshotContext(supabase, options);
  const contractByInquiryId = new Map<string, ContractRow>();
  const interactionsByInquiryId = new Map<string, InteractionRow[]>();
  const activitiesByInquiryId = new Map<string, ActivityRow[]>();
  const tasksByInquiryId = new Map<string, TaskRow[]>();

  for (const contract of context.contracts) {
    if (contract.inquiry_id) {
      contractByInquiryId.set(contract.inquiry_id, contract);
    }
  }

  for (const interaction of context.customerInteractions) {
    if (!interaction.inquiry_id) continue;
    const bucket = interactionsByInquiryId.get(interaction.inquiry_id) ?? [];
    bucket.push(interaction);
    interactionsByInquiryId.set(interaction.inquiry_id, bucket);
  }

  for (const activity of context.activities) {
    const bucket = activitiesByInquiryId.get(activity.entity_id) ?? [];
    bucket.push(activity);
    activitiesByInquiryId.set(activity.entity_id, bucket);
  }

  for (const task of context.tasks) {
    const bucket = tasksByInquiryId.get(task.inquiry_id) ?? [];
    bucket.push(task);
    tasksByInquiryId.set(task.inquiry_id, bucket);
  }

  let followUpPending = 0;
  let followUpReviewed = 0;

  const leads = context.inquiries.map((inquiry) => {
    const contract = contractByInquiryId.get(inquiry.id) ?? null;
    const stage = mapCrmStage(inquiry, contract);
    const interactions = interactionsByInquiryId.get(inquiry.id) ?? [];
    const activities = activitiesByInquiryId.get(inquiry.id) ?? [];
    const followUpDetails = normalizeInquiryFollowUpDetails(inquiry.follow_up_details_json);
    const hasFollowUpInspiration = inquiryFollowUpNeedsReview(followUpDetails);

    if (followUpDetails) {
      if (hasFollowUpInspiration) {
        followUpPending += 1;
      } else {
        followUpReviewed += 1;
      }
    }

    const estimatedValue = Math.max(
      toNumber(contract?.contract_total, 0),
      toNumber(inquiry.estimated_price, 0),
      toNumber(contract?.deposit_amount, 0)
    );
    const lastContactSource = [
      ...interactions.map((item) => item.created_at),
      ...activities.map((item) => item.created_at),
      inquiry.created_at,
    ].filter((value): value is string => Boolean(value));
    const firstResponseHours = getFirstResponseHours(inquiry.created_at, [
      ...interactions.map((item) => item.created_at),
      ...activities.map((item) => item.created_at),
    ]);
    const owner = getOwner(inquiry);
    const outstandingBalance = getOutstandingBalance(inquiry, contract, stage);
    const paymentStatus = getPaymentStatus(contract, outstandingBalance);

    return {
      id: inquiry.id,
      clientId: inquiry.client_id,
      clientName: formatName(inquiry.first_name, inquiry.last_name),
      email: inquiry.email?.trim().toLowerCase() ?? "",
      phone: inquiry.phone ?? "Not provided",
      eventType: inquiry.event_type ?? "Event",
      eventDate: inquiry.event_date ?? inquiry.created_at,
      venue: inquiry.venue_name ?? "Venue pending",
      stage,
      estimatedValue,
      lastContact: lastContactSource.sort((a, b) => +new Date(b) - +new Date(a))[0] ?? inquiry.created_at,
      nextFollowUp:
        inquiry.crm_next_action_due_at ??
        inquiry.follow_up_at ??
        inquiry.event_date ??
        inquiry.created_at,
      owner,
      nextAction: inquiry.crm_next_action?.trim() || null,
      nextActionDueAt: inquiry.crm_next_action_due_at,
      leadScore: inquiry.crm_lead_score,
      leadTemperature: isCrmLeadTemperature(inquiry.crm_lead_temperature)
        ? inquiry.crm_lead_temperature
        : null,
      source: normalizeSource(inquiry.referral_source),
      budgetRange: getBudgetRange(inquiry, estimatedValue),
      quoteSummary: getQuoteSummary(stage, inquiry, contract),
      paymentSummary: getPaymentSummary(paymentStatus, outstandingBalance),
      notes: buildLeadNotes(inquiry),
      contractStatus: getContractStatus(contract),
      paymentStatus,
      decorStatus: getDecorStatus(inquiry, stage),
      lostReason: stage === "lost" && isCrmLostReason(inquiry.lost_reason) ? inquiry.lost_reason : undefined,
      lostAt: stage === "lost" ? inquiry.crm_lost_at : null,
      lostContext: stage === "lost" ? inquiry.crm_lost_context : null,
      hasFollowUpInspiration,
      contractId: contract?.id ?? null,
      inquiryStatus: inquiry.status,
      consultationStatus: inquiry.consultation_status,
      quoteResponseStatus: inquiry.quote_response_status,
      bookingStage: inquiry.booking_stage,
      createdAt: inquiry.created_at,
      consultationAt: inquiry.consultation_at,
      bookedAt:
        inquiry.booked_at ??
        inquiry.reserved_at ??
        contract?.deposit_paid_at ??
        contract?.signed_at ??
        null,
      firstResponseHours,
      outstandingBalance,
    } satisfies CrmLead;
  });

  const persistedTasks: CrmTask[] = context.tasks.map((task) => ({
    id: task.id,
    leadId: task.inquiry_id,
    title: task.title,
    status: mapPersistedTaskStatus(task),
    dueLabel: buildTaskDueLabel(task),
    detail: task.detail ?? undefined,
  }));
  const tasks = [...persistedTasks, ...buildDerivedTasks(leads, persistedTasks)];

  const interactions: CrmInteraction[] = [
    ...context.customerInteractions
      .filter((row) => row.inquiry_id)
      .map((row) => ({
        id: `interaction-${row.id}`,
        leadId: row.inquiry_id as string,
        type: mapInteractionType(row.channel, row.subject),
        title:
          row.subject?.trim() ||
          (row.direction === "inbound" ? "Client reply received" : "Customer interaction"),
        summary: buildInteractionSummary(row),
        createdAt: row.created_at,
        actor: row.direction === "inbound" ? "Client" : row.provider ?? "Email",
      })),
    ...context.activities.map((row) => ({
      id: `activity-${row.id}`,
      leadId: row.entity_id,
      type: mapActivityType(row.action),
      title: row.summary?.trim() || humanizeLabel(row.action),
      summary: humanizeLabel(row.action),
      createdAt: row.created_at,
      actor: "Admin",
    })),
  ]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 60);

  return {
    leads,
    interactions,
    tasks,
    revenueTrend: buildRevenueTrend(leads),
    teamPerformance: buildTeamPerformance(leads),
    dashboardAlerts: buildDashboardAlerts(leads, tasks),
    followUpSummary: {
      pending: followUpPending,
      reviewed: followUpReviewed,
    },
  };
}

export async function getLiveCrmLeadById(supabase: SupabaseClient, inquiryId: string) {
  const snapshot = await getLiveCrmSnapshot(supabase, { inquiryId });
  return snapshot.leads[0] ?? null;
}

export async function getLiveCrmMetrics(supabase: SupabaseClient) {
  const snapshot = await getLiveCrmSnapshot(supabase);
  const outstandingBalances = Math.round(
    snapshot.leads.reduce((sum, lead) => sum + Number(lead.outstandingBalance ?? 0), 0)
  );

  return {
    leads: snapshot.leads,
    interactions: snapshot.interactions,
    tasks: snapshot.tasks,
    revenueTrend: snapshot.revenueTrend,
    teamPerformance: snapshot.teamPerformance,
    dashboardAlerts: snapshot.dashboardAlerts,
    followUpSummary: snapshot.followUpSummary,
    totals: {
      pipelineValue: getPipelineValue(snapshot.leads),
      forecastedRevenue: getForecastedRevenue(snapshot.leads),
      likelyRevenue: getLikelyRevenue(snapshot.leads),
      bookedRevenue: getBookedRevenue(snapshot.leads),
      conversionRate: getConversionRate(snapshot.leads),
      averageEventValue: getAverageEventValue(snapshot.leads),
      outstandingBalances,
      stageCounts: getPipelineStageCounts(snapshot.leads),
    },
  };
}
