import Link from "next/link";
import InquiryRecordActions from "@/components/forms/admin/inquiry-record-actions";
import {
  buildContractsWorkspaceHref,
  buildDocumentDetailHref,
  buildInquiryDetailHref,
  buildInquiryWorkspaceHref,
  buildRentalWorkspaceHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { humanizeBookingStage } from "@/lib/booking-lifecycle";
import { inquiryFollowUpNeedsReview, normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
import {
  getStrongUnmatchedReplyCandidatesByInquiry,
  getUnmatchedInboundReplyCounts,
} from "@/lib/unmatched-inbound-replies";
import StatusBadge from "@/components/forms/admin/status-badge";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";
import { getLiveCrmMetrics } from "@/lib/crm-live";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

type WorkspaceTab = "overview" | "pipeline" | "schedule" | "inquiries";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function buildShare(count: number | null | undefined, total: number | null | undefined) {
  if (!count || !total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePage(pageValue?: string) {
  const page = Number(pageValue ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getInquiryReadinessPriority(input: {
  status: string | null;
  consultationStatus: string | null;
  bookingStage: string | null;
  quoteResponseStatus: string | null;
  contractStatus?: string | null;
  depositPaid?: boolean | null;
  nextActionDueAt?: string | null;
  hasFollowUpInspiration?: boolean;
  hasUnmatchedReplyCandidate?: boolean;
}) {
  const now = Date.now();
  const nextActionDueAt = input.nextActionDueAt ? new Date(input.nextActionDueAt).getTime() : Number.POSITIVE_INFINITY;

  if (Number.isFinite(nextActionDueAt) && nextActionDueAt < now) return 0;
  if (input.quoteResponseStatus === "changes_requested") return 1;
  if (input.hasUnmatchedReplyCandidate) return 2;
  if (input.hasFollowUpInspiration) return 3;
  if ((input.contractStatus === "draft" || input.contractStatus === "sent") && !input.depositPaid) return 4;
  if (input.status === "quoted") return 5;
  if (input.consultationStatus === "completed") return 6;
  if (input.consultationStatus === "scheduled" || input.consultationStatus === "requested") return 7;
  if (input.status === "new") return 8;
  if (input.status === "contacted") return 9;
  if (input.status === "booked" || input.bookingStage === "reserved") return 11;
  return 10;
}

function getPaymentState(contract: {
  deposit_paid?: boolean | null;
  balance_due?: number | null;
  contract_status?: string | null;
} | null) {
  if (!contract) {
    return "No contract";
  }

  if (!contract.deposit_paid) {
    return "Deposit pending";
  }

  if (Number(contract.balance_due ?? 0) > 0) {
    return "Balance due";
  }

  return "Paid";
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    event_type?: string;
    follow_up?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await requireAdminPage("overview");

  const params = await searchParams;
  const activeTab: WorkspaceTab = ["overview", "pipeline", "schedule", "inquiries"].includes(
    params.tab ?? ""
  )
    ? (params.tab as WorkspaceTab)
    : "overview";
  const status = params.status || "";
  const eventType = params.event_type || "";
  const followUp = params.follow_up || "";
  const followUpFilterActive = followUp === "with_inspiration";
  const queryText = params.q?.trim() || "";
  const sort = params.sort || "action_readiness";
  const page = normalizePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const inquiryWorkspaceState = {
    status,
    eventType,
    followUp,
    q: queryText,
    sort,
    page,
  };
  const rentalWorkspaceState = { tab: "requests", status: "all" };
  const followUpFilterHref = buildInquiryWorkspaceHref({
    tab: "inquiries",
    state: inquiryWorkspaceState,
    nextStatus: status,
    nextFollowUp: "with_inspiration",
    preservePage: true,
  });
  const clearFollowUpFilterHref = buildInquiryWorkspaceHref({
    tab: "inquiries",
    state: inquiryWorkspaceState,
    nextStatus: status,
    preservePage: true,
  });

  const { data: followUpInspirationRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, follow_up_details_json")
    .neq("follow_up_details_json", "{}");

  const unresolvedFollowUpIds = (followUpInspirationRows ?? [])
    .filter((row) =>
      inquiryFollowUpNeedsReview(normalizeInquiryFollowUpDetails(row.follow_up_details_json))
    )
    .map((row) => row.id);
  const reviewedFollowUpCount = Math.max(
    0,
    (followUpInspirationRows ?? []).length - unresolvedFollowUpIds.length
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();

  let query = supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, created_at, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, booking_stage, estimated_price, consultation_status, consultation_at, quote_response_status, follow_up_details_json, crm_next_action_due_at",
      { count: "exact" }
    )
    ;

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.neq("status", "archived");
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (followUp === "with_inspiration") {
    if (unresolvedFollowUpIds.length) {
      query = query.in("id", unresolvedFollowUpIds);
    } else {
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
    }
  }

  if (queryText) {
    const safeQuery = queryText.replace(/,/g, " ");
    query = query.or(
      `first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%,venue_name.ilike.%${safeQuery}%`
    );
  }

  if (sort === "event_date") {
    query = query.order("event_date", { ascending: true, nullsFirst: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count: filteredCount } = await query;
  let orderedRows = data ?? [];
  const inquiryIds = orderedRows.map((item) => item.id);
  const unmatchedReplyCandidatesByInquiry = await getStrongUnmatchedReplyCandidatesByInquiry(
    (data ?? []).map((item) => ({
      id: item.id,
      email: item.email,
    }))
  );

  const { data: pageContracts } = inquiryIds.length
    ? await supabaseAdmin
        .from("contracts")
        .select("id, inquiry_id, contract_status, deposit_paid, balance_due")
        .in("inquiry_id", inquiryIds)
    : {
        data: [] as Array<{
          id: string;
          inquiry_id: string;
          contract_status: string | null;
          deposit_paid: boolean | null;
          balance_due: number | null;
        }>,
      };

  const contractMap = new Map((pageContracts ?? []).map((item) => [item.inquiry_id, item]));
  const { data: pageInvoices } = inquiryIds.length
    ? await supabaseAdmin
        .from("client_documents")
        .select("id, inquiry_id")
        .eq("document_type", "invoice")
        .in("inquiry_id", inquiryIds)
        .order("created_at", { ascending: false })
    : {
        data: [] as Array<{
          id: string;
          inquiry_id: string | null;
        }>,
      };
  const invoiceMap = new Map<string, { id: string }>();
  for (const invoice of pageInvoices ?? []) {
    if (!invoice.inquiry_id || invoiceMap.has(invoice.inquiry_id)) {
      continue;
    }
    invoiceMap.set(invoice.inquiry_id, { id: invoice.id });
  }

  if (sort === "action_readiness") {
    orderedRows = [...orderedRows].sort((a, b) => {
      const aFollowUp = inquiryFollowUpNeedsReview(
        normalizeInquiryFollowUpDetails(a.follow_up_details_json)
      );
      const bFollowUp = inquiryFollowUpNeedsReview(
        normalizeInquiryFollowUpDetails(b.follow_up_details_json)
      );
      const aUnmatched = (unmatchedReplyCandidatesByInquiry[a.id] ?? []).length > 0;
      const bUnmatched = (unmatchedReplyCandidatesByInquiry[b.id] ?? []).length > 0;
      const aContract = contractMap.get(a.id) ?? null;
      const bContract = contractMap.get(b.id) ?? null;

      const priorityDiff =
        getInquiryReadinessPriority({
          status: a.status,
          consultationStatus: a.consultation_status,
          bookingStage: a.booking_stage,
          quoteResponseStatus: a.quote_response_status,
          contractStatus: aContract?.contract_status ?? null,
          depositPaid: aContract?.deposit_paid ?? null,
          nextActionDueAt: a.crm_next_action_due_at,
          hasFollowUpInspiration: aFollowUp,
          hasUnmatchedReplyCandidate: aUnmatched,
        }) -
        getInquiryReadinessPriority({
          status: b.status,
          consultationStatus: b.consultation_status,
          bookingStage: b.booking_stage,
          quoteResponseStatus: b.quote_response_status,
          contractStatus: bContract?.contract_status ?? null,
          depositPaid: bContract?.deposit_paid ?? null,
          nextActionDueAt: b.crm_next_action_due_at,
          hasFollowUpInspiration: bFollowUp,
          hasUnmatchedReplyCandidate: bUnmatched,
        });

      if (priorityDiff !== 0) return priorityDiff;

      const aDue = a.crm_next_action_due_at ? new Date(a.crm_next_action_due_at).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.crm_next_action_due_at ? new Date(b.crm_next_action_due_at).getTime() : Number.POSITIVE_INFINITY;
      const dueDiff = aDue - bDue;
      if (Number.isFinite(dueDiff) && dueDiff !== 0) return dueDiff;

      const eventDiff =
        (a.event_date ? new Date(a.event_date).getTime() : Number.POSITIVE_INFINITY) -
        (b.event_date ? new Date(b.event_date).getTime() : Number.POSITIVE_INFINITY);
      if (Number.isFinite(eventDiff) && eventDiff !== 0) return eventDiff;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  const pagedRows = orderedRows.slice(from, to + 1);

  const { count: totalCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .neq("status", "archived");

  const { count: pendingCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "contacted"]);

  const { count: quotedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const { count: bookedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked");

  const { count: underReviewCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("consultation_status", "under_review");

  const { count: scheduledConsultationCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .not("consultation_at", "is", null);

  const { count: reservedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("booking_stage", "reserved");

  const { count: outstandingFinalPayments } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .gt("balance_due", 0);

  const { count: unsignedContractsCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("contract_status", ["draft", "sent"]);

  const { count: unpaidDepositsCount } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("deposit_paid", false);

  const { count: newRentalRequestsCount } = await supabaseAdmin
    .from("rental_quote_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "requested");

  const { count: rentalQuotesAwaitingReplyCount } = await supabaseAdmin
    .from("rental_quote_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const unmatchedReplyCounts = await getUnmatchedInboundReplyCounts();

  const followUpInspirationCount =
    unresolvedFollowUpIds.length;

  const { data: pipelineRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price, status, booking_stage, consultation_status")
    .in("status", ["new", "contacted", "quoted", "booked", "closed_lost"]);

  const pipelineValue =
    pipelineRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ?? 0;
  const contactedCount =
    pipelineRows?.filter((row) => row.status === "contacted").length ?? 0;

  const { count: inquiriesThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .neq("status", "archived")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const { count: bookedThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const conversionRate =
    inquiriesThisMonth && inquiriesThisMonth > 0
      ? ((bookedThisMonth ?? 0) / inquiriesThisMonth) * 100
      : 0;

  const { data: bookedRevenueRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price")
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const bookedRevenueThisMonth =
    bookedRevenueRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ??
    0;

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  const upcomingWindow = new Date(tomorrow);
  upcomingWindow.setDate(upcomingWindow.getDate() + 14);

  const { data: upcomingConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, event_date, consultation_at, consultation_type, consultation_location")
    .neq("status", "archived")
    .not("consultation_at", "is", null)
    .gte("consultation_at", tomorrow.toISOString())
    .lt("consultation_at", upcomingWindow.toISOString())
    .order("consultation_at", { ascending: true })
    .limit(6);

  const weekWindow = new Date(tomorrow);
  weekWindow.setDate(weekWindow.getDate() + 7);

  const { count: upcomingEventsThisWeekCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .neq("status", "archived")
    .gte("event_date", tomorrow.toISOString().split("T")[0])
    .lt("event_date", weekWindow.toISOString().split("T")[0])
    .in("status", ["booked"]);

  const activeLeadCount =
    (pendingCount ?? 0) + (quotedCount ?? 0) + (contactedCount ?? 0) + (underReviewCount ?? 0);
  const consultationsTodayCount =
    (upcomingConsultations ?? []).filter((item) => {
      if (!item.consultation_at) return false;
      return new Date(item.consultation_at).toDateString() === tomorrow.toDateString();
    }).length;
  const pendingFollowUpsCount =
    (pendingCount ?? 0) + followUpInspirationCount + unmatchedReplyCounts.pending_review;

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  const { data: monthEvents } = await supabaseAdmin
    .from("event_inquiries")
    .select("event_date")
    .neq("status", "archived")
    .gte("event_date", currentMonthStart)
    .lt("event_date", currentMonthEnd)
    .order("event_date", { ascending: true });

  const loadByDate = new Map<string, number>();
  for (const item of monthEvents ?? []) {
    if (!item.event_date) continue;
    loadByDate.set(item.event_date, (loadByDate.get(item.event_date) ?? 0) + 1);
  }

  const busiestDates = Array.from(loadByDate.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  const alerts: Array<{ tone: "warning" | "attention" | "info"; label: string; detail: string }> = [];

  if ((upcomingConsultations ?? []).some((item) => item.consultation_type === "in_person" && !item.consultation_location)) {
    alerts.push({
      tone: "warning",
      label: "Missing meeting location",
      detail: "At least one upcoming in-person consultation is missing a location.",
    });
  }

  if (busiestDates.some(([, count]) => count >= 2)) {
    alerts.push({
      tone: "attention",
      label: "Overlapping event dates",
      detail: "Some upcoming dates already carry multiple events. Review calendar load before confirming more bookings.",
    });
  }

  if ((quotedCount ?? 0) > 0) {
    alerts.push({
      tone: "info",
      label: "Pending quote follow-up",
      detail: `${quotedCount} quoted request${quotedCount === 1 ? "" : "s"} still need movement toward contract.`,
    });
  }

  if ((outstandingFinalPayments ?? 0) > 0) {
    alerts.push({
      tone: "warning",
      label: "Outstanding payments",
      detail: `${outstandingFinalPayments} contract${outstandingFinalPayments === 1 ? "" : "s"} still have remaining balance due.`,
    });
  }

  const { data: recentActivity } = await supabaseAdmin
    .from("activity_log")
    .select("id, summary, action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const responseSamples = crmMetrics.leads.filter(
    (lead) => lead.firstResponseHours !== null && lead.firstResponseHours !== undefined
  );
  const averageResponseHours = responseSamples.length
    ? Number(
        (
          responseSamples.reduce((sum, lead) => sum + Number(lead.firstResponseHours ?? 0), 0) /
          responseSamples.length
        ).toFixed(1)
      )
    : null;

  const { data: pipelineBoardRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, event_date, status, consultation_status, booking_stage, consultation_at, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost", "archived"];
  const eventTypes = [
    "Wedding",
    "Traditional (Melsi)",
    "Birthday",
    "Baby Shower",
    "Bridal Shower",
    "Corporate Event",
    "Graduation",
    "Anniversary",
  ];

  const reportCards = [
    {
      label: "New inquiries",
      value: String(pendingCount ?? 0),
      note: "Need first response",
      tone: "amber",
      href: buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "new" }),
    },
    {
      label: "Active leads",
      value: String(activeLeadCount),
      note: "Still moving through CRM",
      tone: "blue",
      href: "/admin/crm-analytics?tab=leads",
    },
    {
      label: "Booked events",
      value: String(bookedCount ?? 0),
      note: "Confirmed work on calendar",
      tone: "green",
      href: buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState }),
    },
    {
      label: "Pending quotes",
      value: String(quotedCount ?? 0),
      note: "Awaiting client movement",
      tone: "violet",
      href: buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "quoted" }),
    },
    {
      label: "Pending payments",
      value: String(outstandingFinalPayments ?? 0),
      note: "Open balances still due",
      tone: "red",
      href: buildContractsWorkspaceHref({ queue: "deposit_pending" }),
    },
    {
      label: "Upcoming events",
      value: String(upcomingEventsThisWeekCount ?? 0),
      note: "Booked this week",
      tone: "blue",
      href: "/admin/calendar",
    },
    {
      label: "Revenue this month",
      value: `$${formatMoney(bookedRevenueThisMonth)}`,
      note: "Booked this month",
      tone: "green",
      href: "/admin/finance",
    },
  ];

  const attentionItems = [
    {
      title: "New inquiries waiting on response",
      count: pendingCount ?? 0,
      detail: "Fresh leads that still need a first touch or triage.",
      tone: "warning" as const,
      href: buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "new" }),
      cta: "Review leads",
    },
    {
      title: "Contracts still unsigned",
      count: unsignedContractsCount ?? 0,
      detail: "Quotes are moving, but the agreement is not fully secured yet.",
      tone: "attention" as const,
      href: buildContractsWorkspaceHref({ queue: "unsigned" }),
      cta: "Open contracts",
    },
    {
      title: "Deposits not yet received",
      count: unpaidDepositsCount ?? 0,
      detail: "Follow up before dates drift into soft-hold territory.",
      tone: "warning" as const,
      href: buildContractsWorkspaceHref({ queue: "deposit_pending" }),
      cta: "Track payments",
    },
    {
      title: "Upcoming consultations",
      count: upcomingConsultations?.length ?? 0,
      detail: "Meetings within the next two weeks that need preparation.",
      tone: "info" as const,
      href: buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState }),
      cta: "View schedule",
    },
    {
      title: "Follow-up inspiration ready for review",
      count: followUpInspirationCount ?? 0,
      detail: "Clients added inspiration images or style notes after the initial request.",
      tone: "info" as const,
      href: buildInquiryWorkspaceHref({
        tab: "inquiries",
        state: inquiryWorkspaceState,
        nextStatus: status,
        nextFollowUp: "with_inspiration",
      }),
      cta: "Review follow-up",
    },
    {
      title: "Unmatched replies awaiting review",
      count: unmatchedReplyCounts.pending_review,
      detail:
        "Inbound emails were held back because the system could not safely prove the exact opportunity.",
      tone: "warning" as const,
      href: buildUnmatchedReplyReviewHref({ status: "pending_review" }),
      cta: "Review replies",
    },
    {
      title: "Rental requests waiting on review",
      count: newRentalRequestsCount ?? 0,
      detail: "New rental quote requests that still need inventory and logistics review.",
      tone: "warning" as const,
      href: buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextStatus: "requested" }),
      cta: "Open rentals",
    },
    {
      title: "Rental quotes awaiting reply",
      count: rentalQuotesAwaitingReplyCount ?? 0,
      detail: "Rental clients have been quoted and still need a follow-up or decision.",
      tone: "attention" as const,
      href: buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextStatus: "quoted" }),
      cta: "Review rental pipeline",
    },
  ].filter((item) => item.count > 0);

  const pipelineSnapshot = [
    {
      label: "New",
      count: pipelineRows?.filter((row) => row.status === "new").length ?? 0,
      note: "Incoming requests",
    },
    {
      label: "Contacted",
      count: pipelineRows?.filter((row) => row.status === "contacted").length ?? 0,
      note: "Follow-up in motion",
    },
    {
      label: "Consultation Scheduled",
      count: pipelineRows?.filter((row) => row.consultation_status === "scheduled").length ?? 0,
      note: "Meetings confirmed",
    },
    {
      label: "Quote Sent",
      count: pipelineRows?.filter((row) => row.status === "quoted").length ?? 0,
      note: "Awaiting response",
    },
    {
      label: "Booked",
      count:
        pipelineRows?.filter(
          (row) => row.booking_stage === "reserved" || row.status === "booked"
        ).length ?? 0,
      note: "Dates reserved",
    },
  ];

  const pipelineColumns = [
    {
      label: "New",
      items: pipelineBoardRows?.filter((row) => row.status === "new").slice(0, 8) ?? [],
    },
    {
      label: "Under Review",
      items:
        pipelineBoardRows?.filter(
          (row) => row.consultation_status === "under_review" || row.status === "contacted"
        ).slice(0, 8) ?? [],
    },
    {
      label: "Consultation",
      items:
        pipelineBoardRows?.filter(
          (row) => row.consultation_status === "scheduled" || Boolean(row.consultation_at)
        ).slice(0, 8) ?? [],
    },
    {
      label: "Quoted",
      items: pipelineBoardRows?.filter((row) => row.status === "quoted").slice(0, 8) ?? [],
    },
    {
      label: "Booked",
      items:
        pipelineBoardRows?.filter(
          (row) => row.booking_stage === "reserved" || row.status === "booked"
        ).slice(0, 8) ?? [],
    },
  ];

  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));
  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function buildPageHref(nextPageValue: number) {
    return buildInquiryWorkspaceHref({
      tab: "inquiries",
      state: {
        ...inquiryWorkspaceState,
        page: nextPageValue,
      },
      nextStatus: status,
      nextFollowUp: followUp || undefined,
      preservePage: true,
    });
  }

  const tabHeadingMap: Record<WorkspaceTab, { title: string; description: string }> = {
    overview: {
      title: "Overview",
      description: "High-level business summary, current priorities, recent activity, and quick actions.",
    },
    pipeline: {
      title: "Pipeline",
      description: "Track inquiry movement from new lead to confirmed booking in one place.",
    },
    schedule: {
      title: "Schedule",
      description: "See consultations, reserved dates, and any scheduling issues coming up next.",
    },
    inquiries: {
      title: "Inquiries",
      description: "Search, filter, and manage the full inquiry record list without losing context.",
    },
  };

  return (
    <main className="section admin-page admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{tabHeadingMap[activeTab].title}</h1>
          <p>{tabHeadingMap[activeTab].description}</p>
        </div>
      </header>

      {activeTab === "overview" ? null : (
        <div className="admin-workspace-tabs admin-workspace-tabs--inline admin-reference-tabs">
          <Link
            href={buildInquiryWorkspaceHref({ tab: "overview", state: inquiryWorkspaceState })}
            className="admin-workspace-tab"
          >
            Overview
          </Link>
          <Link
            href={buildInquiryWorkspaceHref({ tab: "pipeline", state: inquiryWorkspaceState })}
            className={`admin-workspace-tab${activeTab === "pipeline" ? " is-active" : ""}`}
          >
            Pipeline
          </Link>
          <Link
            href={buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState })}
            className={`admin-workspace-tab${activeTab === "schedule" ? " is-active" : ""}`}
          >
            Schedule
          </Link>
          <Link
            href={buildInquiryWorkspaceHref({
              tab: "inquiries",
              state: inquiryWorkspaceState,
              nextStatus: status,
              nextFollowUp: followUp || undefined,
              preservePage: true,
            })}
            className={`admin-workspace-tab${activeTab === "inquiries" ? " is-active" : ""}`}
          >
            Inquiries
          </Link>
        </div>
      )}

      {activeTab === "overview" ? (
        <>
          <section className="card admin-panel admin-panel--wide admin-section-card admin-overview-hero-shell">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">CRM preview</p>
                <h3>Pipeline stays in one source of truth</h3>
                <p className="muted">Use Overview for priorities and activity, then jump into CRM Pipeline for stage movement and conversion tracking.</p>
              </div>
            </div>

            <div className="admin-reference-head-pills">
              {pipelineSnapshot.map((item) => (
                <span key={item.label} className="admin-reference-head-pill">
                  {item.label}: {item.count}
                </span>
              ))}
            </div>
            <div className="admin-inline-actions">
              <Link href="/admin/crm-analytics" className="admin-head-pill admin-head-pill--active">
                Open CRM Pipeline
              </Link>
              <Link href="/admin/crm-analytics?tab=leads" className="admin-head-pill">
                Open leads
              </Link>
            </div>
          </section>

          <section className="admin-reference-kpi-strip admin-overview-kpi-strip">
            <div className="admin-kpi-grid admin-reference-kpi-grid admin-overview-kpi-grid">
              {reportCards.map((card) => (
                card.href ? (
                  <Link
                    key={card.label}
                    href={card.href}
                    className={`card metric-card admin-reference-kpi-card admin-kpi-link-card`}
                  >
                    <p className="muted admin-reference-kpi-label">{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.note}</span>
                  </Link>
                ) : (
                  <div key={card.label} className="card metric-card admin-reference-kpi-card">
                    <p className="muted admin-reference-kpi-label">{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.note}</span>
                  </div>
                )
              ))}
            </div>
          </section>

          <section className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <section className="card admin-panel admin-section-card admin-reference-records-shell">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Today / This week</p>
                  <h3>Immediate priorities</h3>
                  <p className="muted">Focus only on the items that change the next seven days.</p>
                </div>
              </div>
              <div className="admin-placeholder-list">
                <div>
                  <strong>Consultations today</strong>
                  <span>{consultationsTodayCount} scheduled for today.</span>
                </div>
                <div>
                  <strong>Events this week</strong>
                  <span>{upcomingEventsThisWeekCount ?? 0} booked event{(upcomingEventsThisWeekCount ?? 0) === 1 ? "" : "s"} this week.</span>
                </div>
                <div>
                  <strong>Payments due</strong>
                  <span>{outstandingFinalPayments ?? 0} open contract balance{(outstandingFinalPayments ?? 0) === 1 ? "" : "s"}.</span>
                </div>
                <div>
                  <strong>Contracts awaiting signature</strong>
                  <span>{unsignedContractsCount ?? 0} contract{(unsignedContractsCount ?? 0) === 1 ? "" : "s"} still unsigned.</span>
                </div>
                <div>
                  <strong>Pending follow-ups</strong>
                  <span>{pendingFollowUpsCount} active follow-up item{pendingFollowUpsCount === 1 ? "" : "s"} need attention.</span>
                </div>
              </div>
            </section>

            <section className="card admin-panel admin-section-card admin-reference-records-shell">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Quick actions</p>
                  <h3>Start work fast</h3>
                  <p className="muted">Open the most common creation paths without scanning the whole portal.</p>
                </div>
              </div>
              <div className="admin-documents-chip-row">
                <Link href="/admin/inquiries/new" className="admin-documents-chip is-active">Add Inquiry</Link>
                <Link href="/admin/crm-analytics?tab=customers" className="admin-documents-chip">Add Customer</Link>
                <Link href="/admin/documents/new?type=quote" className="admin-documents-chip">Create Quote</Link>
                <Link href="/admin/documents/new?type=invoice" className="admin-documents-chip">Create Invoice</Link>
                <Link href="/admin/rentals/new" className="admin-documents-chip">Add Rental Item</Link>
              </div>
            </section>
          </section>

          <section className="card admin-panel admin-panel--wide admin-section-card admin-overview-actions-shell">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Recent activity</p>
                <h3>What changed most recently</h3>
                <p className="muted">
                  {recentActivity?.length ?? 0} rolling items across inquiry, document, contract, and payment updates.
                </p>
              </div>
            </div>

            {recentActivity?.length ? (
              <div className="admin-activity-list">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="admin-activity-item">
                    <div>
                      <strong>{entry.summary || humanizeLabel(entry.action)}</strong>
                      <p>{humanizeLabel(entry.entity_type)} • {humanizeLabel(entry.action)}</p>
                    </div>
                    <span>{formatRelativeTimestamp(entry.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No recent activity has been logged yet.</p>
            )}
          </section>

          <section className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <div className="card admin-panel admin-section-card">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Needs attention</p>
                  <h3>Operations queue</h3>
                </div>
              </div>

              {attentionItems.length ? (
                <div className="admin-attention-list">
                  {attentionItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="admin-attention-row"
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                      <span>{item.count}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="admin-alert-card admin-alert-card--success">
                  <strong>Operations look clear</strong>
                  <p>No urgent follow-up, contract, payment, or calendar issues are blocking the workflow right now.</p>
                </div>
              )}
            </div>

            <div className="card admin-panel admin-section-card admin-panel--performance">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">CRM handoff</p>
                  <h3>Pipeline and revenue context</h3>
                  <p className="muted">Keep forecast in CRM and actual cash in Finance without duplicating the same view twice.</p>
                </div>
              </div>

              <div className="admin-list">
                <div className="admin-list-item">
                  <strong>Pipeline value</strong>
                  <span>${formatMoney(pipelineValue)} forecast</span>
                </div>
                <div className="admin-list-item">
                  <strong>Conversion rate</strong>
                  <span>{conversionRate.toFixed(1)}% inquiry to booked</span>
                </div>
                <div className="admin-list-item">
                  <strong>Booked revenue this month</strong>
                  <span>${formatMoney(bookedRevenueThisMonth)}</span>
                </div>
                <div className="admin-list-item">
                  <strong>Average response</strong>
                  <span>{averageResponseHours !== null ? `${averageResponseHours}h` : "—"} to first contact</span>
                </div>
              </div>
              <div className="admin-inline-actions">
                <Link href="/admin/crm-analytics" className="admin-head-pill">Open CRM pipeline</Link>
                <Link href="/admin/finance" className="admin-head-pill">Open finance</Link>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "pipeline" ? (
        <section className="card admin-panel admin-section-card">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Pipeline board</p>
              <h3>Inquiry movement by stage</h3>
              <p className="muted">Click into any card to move a request forward from review to booking.</p>
            </div>
          </div>

          <div className="admin-kanban-grid admin-kanban-grid--pipeline">
            {pipelineColumns.map((column) => (
              <div key={column.label} className="admin-kanban-column card">
                <div className="admin-kanban-head">
                  <span className="eyebrow">{column.items.length} items</span>
                  <h4>{column.label}</h4>
                </div>
                <div className="admin-kanban-list">
                  {column.items.length ? (
                    column.items.map((item) => (
                      <Link key={item.id} href={buildInquiryDetailHref(item.id)} className="admin-kanban-card">
                        <strong>{item.first_name} {item.last_name}</strong>
                        <span>{item.event_type || "Event"}</span>
                        <small>{item.event_date ? new Date(item.event_date).toLocaleDateString() : "Date pending"}</small>
                      </Link>
                    ))
                  ) : (
                    <div className="admin-kanban-card">
                      <strong>No records</strong>
                      <small>This stage is currently clear.</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "schedule" ? (
        <section className="admin-dashboard-row">
          <div className="card admin-panel admin-panel--wide admin-section-card">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Consultations and reserved dates</p>
                <h3>Upcoming schedule</h3>
                <p className="muted">Consultations, reserved dates, and booking-load signals grouped in one place.</p>
              </div>
              <div className="admin-inline-actions">
                <Link href="/admin/calendar" className="admin-topbar-pill">
                  Full calendar
                </Link>
              </div>
            </div>

            <div className="admin-schedule-board">
              <div className="admin-schedule-column">
                <strong className="admin-schedule-heading">Upcoming consultations</strong>
                {(upcomingConsultations ?? []).length ? (
                  <div className="admin-schedule-list">
                    {upcomingConsultations?.map((item) => (
                      <Link key={item.id} href={buildInquiryDetailHref(item.id)} className="admin-schedule-item">
                        <div>
                          <strong>{item.first_name} {item.last_name}</strong>
                          <p>{item.event_type || "Event"} {item.event_date ? `• ${new Date(item.event_date).toLocaleDateString()}` : ""}</p>
                        </div>
                        <span>{formatDateTime(item.consultation_at)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No consultations scheduled in the next two weeks.</p>
                )}
              </div>

              <div className="admin-schedule-column">
                <strong className="admin-schedule-heading">Busiest reserved dates</strong>
                {busiestDates.length ? (
                  <div className="admin-date-load-list">
                    {busiestDates.map(([date, count]) => (
                      <div key={date} className={`admin-date-load admin-date-load--${count >= 3 ? "high" : count === 2 ? "medium" : "low"}`}>
                        <div>
                          <strong>{new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong>
                          <p>{count} booking{count === 1 ? "" : "s"} on the calendar</p>
                        </div>
                        <span>{count >= 3 ? "High Load" : count === 2 ? "Double Booking" : "Reserved"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No reserved dates are carrying visible load this month.</p>
                )}
              </div>
            </div>
          </div>

          <div className="card admin-panel admin-section-card">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Schedule alerts</p>
                <h3>Warnings and blockers</h3>
                <p className="muted">Double-booking alerts, missing details, and payment signals separated from the main overview.</p>
              </div>
            </div>

            <div className="admin-alert-stack">
              {alerts.length ? (
                alerts.map((alert) => (
                  <div key={alert.label} className={`admin-alert-card admin-alert-card--${alert.tone}`}>
                    <strong>{alert.label}</strong>
                    <p>{alert.detail}</p>
                  </div>
                ))
              ) : (
                <div className="admin-alert-card admin-alert-card--success">
                  <strong>Schedule looks clear</strong>
                  <p>No upcoming load or consultation alerts are blocking the calendar right now.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "inquiries" ? (
        <>
          <div className="admin-workspace-subheader">
            <form method="GET" className="admin-filters admin-filters--records admin-filters--sticky admin-reference-records-shell">
              <input type="hidden" name="tab" value="inquiries" />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="event_type" value={eventType} />
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="follow_up" value={followUp} />
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Inquiry records</p>
                  <h3>Inquiry records</h3>
                  <p className="muted">Search and filter the inquiry system without losing visibility into request status, event type, or follow-up review.</p>
                </div>
              </div>
              <div className="admin-reference-head-pills">
                <span className="admin-reference-head-pill admin-reference-head-pill--strong">
                  Showing {filteredCount ?? 0} inquiries
                </span>
                <span className="admin-reference-head-pill">Follow-up pending</span>
                <span className="admin-reference-head-pill">{unresolvedFollowUpIds.length}</span>
                <span className="admin-reference-head-pill">Reviewed</span>
                <span className="admin-reference-head-pill">{reviewedFollowUpCount}</span>
                <Link
                  href={followUpFilterHref}
                  className={`admin-head-pill${followUpFilterActive ? " admin-head-pill--active" : ""}`}
                >
                  Pending follow-up review
                </Link>
                {followUpFilterActive ? (
                  <Link
                    href={clearFollowUpFilterHref}
                    className="admin-head-pill admin-head-pill--clear"
                  >
                    Clear follow-up filter
                  </Link>
                ) : null}
              </div>
              <div className="field admin-reference-filter-group">
                <label className="label">Search</label>
                <input
                  name="q"
                  defaultValue={queryText}
                  className="input"
                  placeholder="Client, email, phone, or venue"
                />
              </div>
              <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
                <div className="field admin-reference-filter-group">
                  <label className="label">Status</label>
                  <div className="admin-documents-chip-row">
                    <Link
                      href={buildInquiryWorkspaceHref({
                        tab: "inquiries",
                        state: inquiryWorkspaceState,
                        nextStatus: "",
                        nextEventType: eventType,
                        nextFollowUp: followUp || undefined,
                        nextSort: sort,
                      })}
                      className={`admin-documents-chip${!status ? " is-active" : ""}`}
                    >
                      All
                    </Link>
                    {statuses.map((item) => (
                      <Link
                        key={item}
                        href={buildInquiryWorkspaceHref({
                          tab: "inquiries",
                          state: inquiryWorkspaceState,
                          nextStatus: item,
                          nextEventType: eventType,
                          nextFollowUp: followUp || undefined,
                          nextSort: sort,
                        })}
                        className={`admin-documents-chip${status === item ? " is-active" : ""}`}
                      >
                        {humanizeLabel(item)}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="field admin-reference-filter-group">
                  <label className="label">Event Type</label>
                  <div className="admin-documents-chip-row">
                    <Link
                      href={buildInquiryWorkspaceHref({
                        tab: "inquiries",
                        state: inquiryWorkspaceState,
                        nextStatus: status,
                        nextEventType: "",
                        nextFollowUp: followUp || undefined,
                        nextSort: sort,
                      })}
                      className={`admin-documents-chip${!eventType ? " is-active" : ""}`}
                    >
                      All
                    </Link>
                    {eventTypes.map((item) => (
                      <Link
                        key={item}
                        href={buildInquiryWorkspaceHref({
                          tab: "inquiries",
                          state: inquiryWorkspaceState,
                          nextStatus: status,
                          nextEventType: item,
                          nextFollowUp: followUp || undefined,
                          nextSort: sort,
                        })}
                        className={`admin-documents-chip${eventType === item ? " is-active" : ""}`}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
                <div className="field admin-reference-filter-group">
                  <label className="label">Sort By</label>
                  <div className="admin-documents-chip-row">
                    {[
                      { value: "action_readiness", label: "Action readiness" },
                      { value: "newest", label: "Newest" },
                      { value: "oldest", label: "Oldest" },
                      { value: "event_date", label: "Event date" },
                    ].map((option) => (
                      <Link
                        key={option.value}
                        href={buildInquiryWorkspaceHref({
                          tab: "inquiries",
                          state: inquiryWorkspaceState,
                          nextStatus: status,
                          nextEventType: eventType,
                          nextFollowUp: followUp || undefined,
                          nextSort: option.value,
                        })}
                        className={`admin-documents-chip${sort === option.value ? " is-active" : ""}`}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className={`field admin-reference-filter-group${followUpFilterActive ? " admin-filter-field--active" : ""}`}>
                  <label className="label">Follow-up</label>
                  <div className="admin-documents-chip-row">
                    <Link
                      href={buildInquiryWorkspaceHref({
                        tab: "inquiries",
                        state: inquiryWorkspaceState,
                        nextStatus: status,
                        nextEventType: eventType,
                        nextFollowUp: "",
                        nextSort: sort,
                      })}
                      className={`admin-documents-chip${!followUp ? " is-active" : ""}`}
                    >
                      All
                    </Link>
                    <Link
                      href={buildInquiryWorkspaceHref({
                        tab: "inquiries",
                        state: inquiryWorkspaceState,
                        nextStatus: status,
                        nextEventType: eventType,
                        nextFollowUp: "with_inspiration",
                        nextSort: sort,
                      })}
                      className={`admin-documents-chip${followUp === "with_inspiration" ? " is-active" : ""}`}
                    >
                      Has follow-up inspiration
                    </Link>
                  </div>
                </div>
              </div>

              <div className="admin-filter-actions">
                <button type="submit" className="btn">
                  Apply
                </button>
                <Link href="/admin/inquiries?tab=inquiries" className="btn secondary">
                  Reset
                </Link>
              </div>
            </form>
          </div>

          <div className="card admin-table-card admin-records-table-card">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Request table</p>
                <h3>Clients, quotes, and payments</h3>
                <p className="muted">Review inquiry state, quote progress, and payment readiness from one clean records table.</p>
              </div>
            </div>

            {error ? <p className="error">Failed to load inquiries: {error.message}</p> : null}

            <div className="admin-record-table-shell">
              <table className="admin-records-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Event Type</th>
                    <th>Event Date</th>
                    <th>Consultation Date</th>
                    <th>Status</th>
                    <th>Quote</th>
                    <th>Payment</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length ? (
                    pagedRows.map((row) => {
                      const contract = contractMap.get(row.id) ?? null;
                      const needsQuoteRevision =
                        row.quote_response_status === "changes_requested";
                      const hasFollowUpInspiration = inquiryFollowUpNeedsReview(
                        normalizeInquiryFollowUpDetails(row.follow_up_details_json)
                      );
                      const unmatchedReplyCandidates =
                        unmatchedReplyCandidatesByInquiry[row.id] ?? [];
                      const hasUnmatchedReplyCandidate =
                        unmatchedReplyCandidates.length > 0;
                      const unmatchedReplyReviewHref = buildUnmatchedReplyReviewHref({
                        status: "pending_review",
                        replyId: unmatchedReplyCandidates[0]?.replyId ?? null,
                      });

                      return (
                        <tr
                          key={row.id}
                          className={
                            needsQuoteRevision || hasFollowUpInspiration || hasUnmatchedReplyCandidate
                              ? "admin-record-row--attention"
                              : undefined
                          }
                        >
                          <td>
                            <div className="admin-record-main">
                              <strong>
                                {row.first_name} {row.last_name}
                              </strong>
                              <span>{row.email}</span>
                            </div>
                          </td>
                          <td>{row.event_type}</td>
                          <td>{row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}</td>
                          <td>{formatDateTime(row.consultation_at)}</td>
                          <td>
                            <div className="admin-record-status-stack">
                              <StatusBadge status={row.status ?? "new"} />
                              <span className="admin-record-substatus admin-record-substatus--compact">
                                {needsQuoteRevision
                                  ? "Responded follow-up reply"
                                  : hasFollowUpInspiration
                                    ? "Follow-up inspiration added"
                                  : hasUnmatchedReplyCandidate
                                    ? "Reply review pending"
                                  : `${humanizeBookingStage(row.booking_stage)} • ${humanizeLabel(row.consultation_status ?? "not_scheduled")}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-record-main">
                              <strong>${formatMoney(Number(row.estimated_price ?? 0))}</strong>
                              <span>{row.quote_response_status ? humanizeLabel(row.quote_response_status) : "Not sent"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-record-main admin-record-main--payment">
                              <strong>{getPaymentState(contract)}</strong>
                              <span>{contract?.contract_status ? humanizeLabel(contract.contract_status) : "Contract not created"}</span>
                              {invoiceMap.get(row.id) && Number(contract?.balance_due ?? 0) > 0 ? (
                                <Link
                                  href={buildDocumentDetailHref(invoiceMap.get(row.id)!.id, {
                                    openPayment: true,
                                    paymentMethod: "cash",
                                  })}
                                  className="admin-inline-action-pill"
                                >
                                  Record Cash Payment
                                </Link>
                              ) : null}
                            </div>
                          </td>
                          <td>{new Date(row.created_at).toLocaleDateString()}</td>
                          <td>
                            <InquiryRecordActions
                              inquiryId={row.id}
                              contractId={contract?.id ?? null}
                              status={row.status ?? "new"}
                              consultationStatus={row.consultation_status ?? "not_scheduled"}
                              bookingStage={row.booking_stage ?? null}
                              quoteResponseStatus={row.quote_response_status ?? "not_sent"}
                              contractStatus={contract?.contract_status ?? null}
                              depositPaid={contract?.deposit_paid ?? null}
                              recordCashPaymentHref={
                                invoiceMap.get(row.id)
                                  ? buildDocumentDetailHref(invoiceMap.get(row.id)!.id, {
                                      openPayment: true,
                                      paymentMethod: "cash",
                                    })
                                  : null
                              }
                              unmatchedReplyCandidateCount={unmatchedReplyCandidates.length}
                              unmatchedReplyReviewHref={unmatchedReplyReviewHref}
                              showPrimaryAction={false}
                              compactTrigger
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="admin-records-empty">
                        No inquiry records match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-mobile-records">
              {pagedRows.map((row) => {
                const contract = contractMap.get(row.id) ?? null;
                const needsQuoteRevision =
                  row.quote_response_status === "changes_requested";
                const hasFollowUpInspiration = inquiryFollowUpNeedsReview(
                  normalizeInquiryFollowUpDetails(row.follow_up_details_json)
                );
                const unmatchedReplyCandidates =
                  unmatchedReplyCandidatesByInquiry[row.id] ?? [];
                const hasUnmatchedReplyCandidate = unmatchedReplyCandidates.length > 0;
                const unmatchedReplyReviewHref = buildUnmatchedReplyReviewHref({
                  status: "pending_review",
                  replyId: unmatchedReplyCandidates[0]?.replyId ?? null,
                });

                return (
                  <div
                    key={row.id}
                    className={`admin-mobile-record${
                      needsQuoteRevision || hasFollowUpInspiration || hasUnmatchedReplyCandidate
                        ? " admin-mobile-record--attention"
                        : ""
                    }`}
                  >
                    <div className="admin-mobile-record-head">
                      <div>
                        <strong>{row.first_name} {row.last_name}</strong>
                        <span>{row.event_type}</span>
                        {needsQuoteRevision ? (
                          <span className="admin-inline-attention-chip">
                            Client requested quote changes
                          </span>
                        ) : null}
                        {hasFollowUpInspiration ? (
                          <span className="admin-inline-attention-chip">
                            Follow-up inspiration added
                          </span>
                        ) : null}
                        {hasUnmatchedReplyCandidate ? (
                          <span className="admin-inline-attention-chip">
                            Has unmatched reply candidate
                          </span>
                        ) : null}
                      </div>
                      <StatusBadge status={row.status ?? "new"} />
                    </div>

                    <div className="admin-mobile-record-grid">
                      <p>
                        <span>Event date</span>
                        {row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}
                      </p>
                      <p>
                        <span>Consultation</span>
                        {formatDateTime(row.consultation_at)}
                      </p>
                      <p>
                        <span>Booking</span>
                        {humanizeBookingStage(row.booking_stage)}
                      </p>
                      <p>
                        <span>Quote</span>
                        ${formatMoney(Number(row.estimated_price ?? 0))}
                        {needsQuoteRevision ? " · revision needed" : ""}
                      </p>
                      <p>
                        <span>Payment</span>
                        {getPaymentState(contract)}
                        {invoiceMap.get(row.id) && Number(contract?.balance_due ?? 0) > 0 ? (
                          <Link
                            href={buildDocumentDetailHref(invoiceMap.get(row.id)!.id, {
                              openPayment: true,
                              paymentMethod: "cash",
                            })}
                            className="admin-inline-action-pill"
                          >
                            Record Cash Payment
                          </Link>
                        ) : null}
                      </p>
                      <p>
                        <span>Created</span>
                        {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <InquiryRecordActions
                      inquiryId={row.id}
                      contractId={contract?.id ?? null}
                      status={row.status ?? "new"}
                      consultationStatus={row.consultation_status ?? "not_scheduled"}
                      bookingStage={row.booking_stage ?? null}
                      quoteResponseStatus={row.quote_response_status ?? "not_sent"}
                      contractStatus={contract?.contract_status ?? null}
                      depositPaid={contract?.deposit_paid ?? null}
                      recordCashPaymentHref={
                        invoiceMap.get(row.id)
                          ? buildDocumentDetailHref(invoiceMap.get(row.id)!.id, {
                              openPayment: true,
                              paymentMethod: "cash",
                            })
                          : null
                      }
                      unmatchedReplyCandidateCount={unmatchedReplyCandidates.length}
                      unmatchedReplyReviewHref={unmatchedReplyReviewHref}
                    />
                  </div>
                );
              })}
            </div>

            <div className="admin-table-pagination">
              <p className="muted">
                Page {page} of {totalPages}
              </p>
              <div className="admin-package-actions">
                {previousPage ? (
                  <Link href={buildPageHref(previousPage)} className="btn secondary">
                    Previous
                  </Link>
                ) : null}
                {nextPage ? (
                  <Link href={buildPageHref(nextPage)} className="btn secondary">
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
