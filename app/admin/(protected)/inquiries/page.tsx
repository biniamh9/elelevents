import Link from "next/link";
import InquiryRecordActions from "@/components/forms/admin/inquiry-record-actions";
import {
  buildContractsWorkspaceHref,
  buildInquiryDetailHref,
  buildInquiryWorkspaceHref,
  buildRentalWorkspaceHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { buildWorkflowColumnsFromInquiries } from "@/lib/admin-workflow-lane";
import { humanizeBookingStage } from "@/lib/booking-lifecycle";
import { inquiryFollowUpNeedsReview, normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
import {
  getStrongUnmatchedReplyCandidatesByInquiry,
  getUnmatchedInboundReplyCounts,
} from "@/lib/unmatched-inbound-replies";
import StatusBadge from "@/components/forms/admin/status-badge";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";

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
    .select("*", { count: "exact", head: true });

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

  const { count: rentalRequestsThisMonth } = await supabaseAdmin
    .from("rental_quote_requests")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const { data: pipelineRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price, status, booking_stage, consultation_status")
    .in("status", ["new", "contacted", "quoted", "booked", "closed_lost"]);

  const pipelineValue =
    pipelineRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ?? 0;

  const { count: inquiriesThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
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
    .not("consultation_at", "is", null)
    .gte("consultation_at", tomorrow.toISOString())
    .lt("consultation_at", upcomingWindow.toISOString())
    .order("consultation_at", { ascending: true })
    .limit(6);

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  const { data: monthEvents } = await supabaseAdmin
    .from("event_inquiries")
    .select("event_date")
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

  const { data: pipelineBoardRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, event_date, status, consultation_status, booking_stage, consultation_at, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  const pipelineInquiryIds = (pipelineBoardRows ?? []).map((row) => row.id);
  const { data: pipelineContracts } = pipelineInquiryIds.length
    ? await supabaseAdmin
        .from("contracts")
        .select("inquiry_id, contract_status, deposit_paid")
        .in("inquiry_id", pipelineInquiryIds)
    : {
        data: [] as Array<{
          inquiry_id: string;
          contract_status: string | null;
          deposit_paid: boolean | null;
        }>,
      };

  const pipelineContractMap = new Map(
    (pipelineContracts ?? []).map((item) => [item.inquiry_id, item])
  );
  const workflowColumns = buildWorkflowColumnsFromInquiries(
    (pipelineBoardRows ?? []).map((row) => ({
      ...row,
      quote_response_status: null,
      completed_at: null,
      contract_status: pipelineContractMap.get(row.id)?.contract_status ?? null,
      deposit_paid: pipelineContractMap.get(row.id)?.deposit_paid ?? null,
    }))
  ).map((column) => ({
    ...column,
    href:
      column.key === "intake"
        ? buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "new" })
        : column.key === "consultation"
          ? buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState })
          : column.key === "quote"
            ? buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "quoted" })
            : column.key === "handoff"
              ? buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState })
              : column.href,
  }));

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];
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
      label: "New Inquiries",
      value: String(pendingCount ?? 0),
      note: `${buildShare(pendingCount, totalCount)}% of all requests`,
      tone: "amber",
      href: buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "new" }),
    },
    {
      label: "Consultations Scheduled",
      value: String(scheduledConsultationCount ?? 0),
      note: "Meetings currently on the calendar",
      tone: "violet",
      href: buildInquiryWorkspaceHref({ tab: "schedule", state: inquiryWorkspaceState }),
    },
    {
      label: "Pending Quotes",
      value: String(quotedCount ?? 0),
      note: "Waiting on client movement",
      tone: "blue",
      href: buildInquiryWorkspaceHref({ tab: "inquiries", state: inquiryWorkspaceState, nextStatus: "quoted" }),
    },
    {
      label: "Booked Events",
      value: String(reservedCount ?? 0),
      note: `${bookedCount ?? 0} booked • ${conversionRate.toFixed(1)}% conversion`,
      tone: "green",
      href: buildInquiryWorkspaceHref({ tab: "pipeline", state: inquiryWorkspaceState }),
    },
    {
      label: "Booked Revenue",
      value: `$${formatMoney(bookedRevenueThisMonth)}`,
      note: `Outstanding balances: ${outstandingFinalPayments ?? 0}`,
      tone: "red",
      href: buildContractsWorkspaceHref({ queue: "deposit_pending" }),
    },
  ];

  const currentMonthRentalIntake = rentalRequestsThisMonth ?? 0;
  const currentMonthInquiryIntake = inquiriesThisMonth ?? 0;
  const combinedIntakeThisMonth = currentMonthInquiryIntake + currentMonthRentalIntake;
  const rentalIntakeShare =
    combinedIntakeThisMonth > 0 ? Math.round((currentMonthRentalIntake / combinedIntakeThisMonth) * 100) : 0;
  const shouldHighlightRentalIntake =
    currentMonthRentalIntake >= 3 || rentalIntakeShare >= 15;

  if (shouldHighlightRentalIntake) {
    reportCards.splice(3, 0, {
      label: "Rental Requests",
      value: String(currentMonthRentalIntake),
      note: `${rentalIntakeShare}% of this month's total intake`,
      tone: "amber",
      href: buildRentalWorkspaceHref({ state: rentalWorkspaceState, nextStatus: "requested" }),
    });
  }

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
      description: "Recent activity, business indicators, and the clearest next moves for the team.",
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
      <div className="admin-page-header">
        <div>
          <h1>{tabHeadingMap[activeTab].title}</h1>
          <p>{tabHeadingMap[activeTab].description}</p>
        </div>
        {activeTab !== "overview" ? (
          <div className="admin-page-head-aside">
            <span className="admin-head-pill">Showing: {filteredCount ?? 0}</span>
            <span className="admin-head-pill">Pipeline: ${formatMoney(pipelineValue)}</span>
            <span className="admin-head-pill">{conversionRate.toFixed(1)}% conversion</span>
          </div>
        ) : null}
      </div>

      {activeTab === "overview" ? (
        <>
          <section className="card admin-panel admin-panel--wide admin-section-card">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Operating lane</p>
                <h3>Work requests through one shared sequence</h3>
                <p className="muted">New requests move from Intake to Consultation, Quote, Contract, and then Handoff.</p>
              </div>
            </div>

            <div className="admin-workflow-lane">
              {workflowColumns.map((column) => (
                <div key={column.key} className="admin-workflow-lane-column">
                  <div className="admin-workflow-lane-head">
                    <div>
                      <span className="eyebrow">{column.label}</span>
                      <p>{column.description}</p>
                    </div>
                    <strong>{column.count}</strong>
                  </div>

                  <div className="admin-workflow-lane-list">
                    {column.items.length ? (
                      column.items.map((item) => (
                        <div key={item.id} className="admin-workflow-lane-item">
                          <Link href={item.href} className="admin-workflow-lane-item-link">
                            <strong>{item.title}</strong>
                            <span>{item.subtitle}</span>
                          </Link>
                          {item.primaryAction ? (
                            <Link
                              href={item.primaryAction.href}
                              className="admin-workflow-lane-next-action"
                            >
                              <span>Do next</span>
                              <strong>{item.primaryAction.label}</strong>
                            </Link>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="admin-workflow-lane-item admin-workflow-lane-item--empty">
                        <strong>No items here</strong>
                        <span>This stage is currently clear.</span>
                      </div>
                    )}
                  </div>

                  <Link href={column.href} className="admin-topbar-pill">
                    Open {column.label}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-mini-report admin-mini-report--compact">
            <div className="admin-kpi-grid">
              {reportCards.map((card) => (
                card.href ? (
                  <Link
                    key={card.label}
                    href={card.href}
                    className={`card metric-card metric-card--${card.tone} admin-kpi-link-card`}
                  >
                    <p className="muted">{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.note}</span>
                  </Link>
                ) : (
                  <div key={card.label} className={`card metric-card metric-card--${card.tone}`}>
                    <p className="muted">{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.note}</span>
                  </div>
                )
              ))}
            </div>
          </section>

          <section className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <div className="card admin-panel admin-section-card">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Needs attention</p>
                  <h3>Priority follow-up</h3>
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
                  <p className="eyebrow">Performance</p>
                  <h3>Conversion snapshot</h3>
                  <p className="muted">Compare business indicators for the current month.</p>
                </div>
              </div>

              <div className="admin-list">
                <div className="admin-list-item">
                  <strong>Pipeline value</strong>
                  <span>${formatMoney(pipelineValue)}</span>
                </div>
                <div className="admin-list-item">
                  <strong>Conversion rate</strong>
                  <span>{conversionRate.toFixed(1)}% this month</span>
                </div>
                <div className="admin-list-item">
                  <strong>Booked revenue</strong>
                  <span>${formatMoney(bookedRevenueThisMonth)}</span>
                </div>
                <div className="admin-list-item">
                  <strong>Outstanding payments</strong>
                  <span>{outstandingFinalPayments ?? 0} contract balances still open</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card admin-panel admin-panel--wide admin-section-card">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Recent activity</p>
                <h3>What changed most recently</h3>
                <p className="muted">
                  {recentActivity?.length ?? 0} rolling items across inquiry, document, contract, and payment updates.
                </p>
              </div>
            </div>

            <div className="admin-activity-panel">
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
            <form method="GET" className="admin-filters admin-filters--records admin-filters--sticky">
              <input type="hidden" name="tab" value="inquiries" />
              <div className="admin-inline-actions admin-inline-actions--filters">
                <span className="admin-head-pill">Follow-up pending: {unresolvedFollowUpIds.length}</span>
                <span className="admin-head-pill">Reviewed: {reviewedFollowUpCount}</span>
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
              <div className="field">
                <label className="label">Search</label>
                <input
                  name="q"
                  defaultValue={queryText}
                  className="input"
                  placeholder="Client, email, phone, or venue"
                />
              </div>

              <div className="field">
                <label className="label">Status</label>
                <select name="status" defaultValue={status} className="input">
                  <option value="">All</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {humanizeLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">Event Type</label>
                <select name="event_type" defaultValue={eventType} className="input">
                  <option value="">All</option>
                  {eventTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">Sort By</label>
                <select name="sort" defaultValue={sort} className="input">
                  <option value="action_readiness">Action readiness</option>
                  <option value="newest">Created date: newest</option>
                  <option value="oldest">Created date: oldest</option>
                  <option value="event_date">Event date</option>
                </select>
              </div>

              <div className={`field${followUpFilterActive ? " admin-filter-field--active" : ""}`}>
                <label className="label">Follow-up</label>
                <select name="follow_up" defaultValue={followUp} className="input">
                  <option value="">All</option>
                  <option value="with_inspiration">Has follow-up inspiration</option>
                </select>
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
                <p className="eyebrow">Inquiry records</p>
                <h3>Manage the existing records</h3>
                <p className="muted">Search, filter, and act on individual requests without competing dashboard content above the table.</p>
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
                              <span>{row.phone}</span>
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
                          </td>
                          <td>{row.event_type}</td>
                          <td>{row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}</td>
                          <td>{formatDateTime(row.consultation_at)}</td>
                          <td>
                            <div className="admin-record-status-stack">
                              <StatusBadge status={row.status ?? "new"} />
                              <span className="admin-record-substatus">
                                {needsQuoteRevision
                                  ? "Quote revision needed"
                                  : hasFollowUpInspiration
                                    ? "Inspiration follow-up ready for review"
                                  : hasUnmatchedReplyCandidate
                                    ? "Reply review pending for this inquiry"
                                  : `${humanizeBookingStage(row.booking_stage)} • ${humanizeLabel(row.consultation_status ?? "not_scheduled")}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-record-main">
                              <strong>${formatMoney(Number(row.estimated_price ?? 0))}</strong>
                              <span>{row.quote_response_status ? humanizeLabel(row.quote_response_status) : "Not sent"}</span>
                              {needsQuoteRevision ? (
                                <span className="admin-record-alert-copy">
                                  Open the inquiry and revise the itemized quote.
                                </span>
                              ) : null}
                              <span>{row.venue_name ?? "Venue not added"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-record-main">
                              <strong>{getPaymentState(contract)}</strong>
                              <span>{contract?.contract_status ? humanizeLabel(contract.contract_status) : "Contract not created"}</span>
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
                              unmatchedReplyCandidateCount={unmatchedReplyCandidates.length}
                              unmatchedReplyReviewHref={unmatchedReplyReviewHref}
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
