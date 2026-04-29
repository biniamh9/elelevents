import { notFound } from "next/navigation";
import Link from "next/link";
import {
  buildContractDetailHref,
  buildCrmLeadDetailHref,
  buildDocumentDetailHref,
  buildInvoiceCreateHref,
  buildInquiryDetailHref,
  buildInquiryWorkspaceHref,
  buildQuoteCreateHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import InquiryStatusForm from "@/components/forms/admin/inquiry-status-form";
import BookingLifecycleForm from "@/components/forms/admin/booking-lifecycle-form";
import ConsultationManagementForm from "@/components/forms/admin/consultation-management-form";
import FollowUpReviewForm from "@/components/forms/admin/follow-up-review-form";
import QuoteManagementForm from "@/components/forms/admin/quote-management-form";
import CreateContractButton from "@/components/forms/admin/create-contract-button";
import VendorReferralForm from "@/components/forms/admin/vendor-referral-form";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import CustomerTimeline from "@/components/admin/customer-timeline";
import { deriveBookingStage, getBookingWarningLabel, humanizeBookingStage, type BookingStage } from "@/lib/booking-lifecycle";
import { buildCustomerTimeline } from "@/lib/customer-timeline";
import { inquiryFollowUpNeedsReview, normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
import { getStrongUnmatchedReplyCandidatesByInquiry } from "@/lib/unmatched-inbound-replies";
import {
  getInquiryWorkflowPrimaryAction,
  getInquiryWorkflowSecondaryAction,
} from "@/lib/admin-workflow-lane";
import { requireAdminPage } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractLabeledSection(source: string | null | undefined, label: string) {
  if (!source) {
    return null;
  }

  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(?:^|\\n\\n)${escapedLabel}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Za-z][^\\n]*:\\s|$)`));
  return match?.[1]?.trim() || null;
}

function removeLabeledSections(source: string | null | undefined, labels: string[]) {
  if (!source) {
    return null;
  }

  let cleaned = source;

  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(
      new RegExp(`(?:^|\\n\\n)${escapedLabel}:\\s*[\\s\\S]*?(?=\\n\\n[A-Za-z][^\\n]*:\\s|$)`, "g"),
      ""
    );
  }

  const normalized = cleaned
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized || null;
}

type WorkflowStepKey =
  | "intake"
  | "consultation"
  | "quote"
  | "contract"
  | "handoff";

function getWorkflowState(input: {
  status: string | null;
  consultationStatus: string | null;
  quoteResponseStatus: string | null;
  quotedAt: string | null;
  contractStatus: string | null | undefined;
  depositPaid: boolean | null | undefined;
}) {
  const consultationStatus = input.consultationStatus ?? "not_scheduled";
  const quoteResponseStatus = input.quoteResponseStatus ?? "not_sent";
  const contractStatus = input.contractStatus ?? null;

  let currentStep: WorkflowStepKey = "intake";
  let nextActionTitle = "Review and qualify the new request";
  let nextActionDetail =
    "Confirm the lead status, capture admin notes, and make sure the request is ready for consultation planning.";

  if (contractStatus === "signed" || input.depositPaid) {
    currentStep = "handoff";
    nextActionTitle = "Move into booked-event handoff";
    nextActionDetail =
      "Track readiness, floor plans, walkthroughs, vendor coordination, and production milestones for the booked event.";
  } else if (
    contractStatus ||
    quoteResponseStatus === "accepted" ||
    quoteResponseStatus === "changes_requested"
  ) {
    currentStep = "contract";
    nextActionTitle =
      quoteResponseStatus === "changes_requested"
        ? "Revise the quote before contract"
        : "Create the contract and secure deposit";
    nextActionDetail =
      quoteResponseStatus === "changes_requested"
        ? "Update pricing or scope from the client feedback, then resend or move forward to contract."
        : "Turn the approved quote into a contract, send it for signature, and follow up on the deposit.";
  } else if (
    input.quotedAt ||
    input.status === "quoted" ||
    quoteResponseStatus === "awaiting_response"
  ) {
    currentStep = "quote";
    nextActionTitle = "Send and manage the itemized quote";
    nextActionDetail =
      "Finalize the pricing draft, send the quote, and track whether the client approves or requests changes.";
  } else if (
    [
      "requested",
      "under_review",
      "approved",
      "scheduled",
      "completed",
      "reschedule_needed",
      "no_show",
    ].includes(consultationStatus)
  ) {
    currentStep = "consultation";
    nextActionTitle =
      consultationStatus === "completed"
        ? "Turn consultation notes into a quote"
        : "Schedule and complete the consultation";
    nextActionDetail =
      consultationStatus === "completed"
        ? "Use the client direction and meeting notes to prepare the itemized proposal."
        : "Set the meeting type, confirm date and time, and keep the follow-up timeline visible.";
  }

  const stepOrder: WorkflowStepKey[] = [
    "intake",
    "consultation",
    "quote",
    "contract",
    "handoff",
  ];
  const currentIndex = stepOrder.indexOf(currentStep);

  const steps = [
    {
      key: "intake" as const,
      label: "Intake",
      title: "Lead review",
      description: "Confirm request quality, sales notes, and event basics.",
    },
    {
      key: "consultation" as const,
      label: "Consultation",
      title: "Meeting setup",
      description: "Schedule, complete, and follow up on the consultation.",
    },
    {
      key: "quote" as const,
      label: "Quote",
      title: "Proposal stage",
      description: "Build, send, and track the itemized quote.",
    },
    {
      key: "contract" as const,
      label: "Contract",
      title: "Approval + deposit",
      description: "Create the agreement, collect signature, and secure payment.",
    },
    {
      key: "handoff" as const,
      label: "Handoff",
      title: "Booked event operations",
      description: "Manage readiness, logistics, and production handoff.",
    },
  ].map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));

  return {
    currentStep,
    nextActionTitle,
    nextActionDetail,
    steps,
  };
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("overview");

  const { id } = await params;

  const { data: inquiry, error } = await supabaseAdmin
    .from("event_inquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !inquiry) {
    console.error("Inquiry lookup failed:", { id, error });
    notFound();
  }

  const unmatchedReplyCandidatesByInquiry =
    await getStrongUnmatchedReplyCandidatesByInquiry([
      {
        id: inquiry.id,
        email: inquiry.email,
      },
    ]);
  const unmatchedReplyCandidates =
    unmatchedReplyCandidatesByInquiry[inquiry.id] ?? [];
  const hasUnmatchedReplyCandidate = unmatchedReplyCandidates.length > 0;
  const unmatchedReplyReviewHref = buildUnmatchedReplyReviewHref({
    status: "pending_review",
    replyId: unmatchedReplyCandidates[0]?.replyId ?? null,
  });

  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, default_referral_fee")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });

  const { data: vendorReferrals } = await supabaseAdmin
    .from("vendor_referrals")
    .select("id, category, status, fee_amount, created_at, vendor:vendor_accounts(business_name)")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false });

  const { data: pricingCatalogItems } = await supabaseAdmin
    .from("pricing_catalog_items")
    .select("id, name, category, variant, unit_label, unit_price, is_active, notes, sort_order")
    .eq("is_active", true)
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  const { data: inquiryQuotePricing } = await supabaseAdmin
    .from("inquiry_quote_pricing")
    .select("inquiry_id, base_fee, discount_amount, delivery_fee, labor_adjustment, tax_amount, manual_total_override, notes, draft_status, client_disclaimer, generated_at, ready_to_send_at, shared_with_customer_at")
    .eq("inquiry_id", id)
    .maybeSingle();

  const { data: inquiryQuoteLineItems } = await supabaseAdmin
    .from("inquiry_quote_line_items")
    .select("id, inquiry_id, pricing_catalog_item_id, item_name, category, variant, unit_label, unit_price, quantity, line_total, notes, sort_order, is_custom")
    .eq("inquiry_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: linkedContract } = await supabaseAdmin
    .from("contracts")
    .select("id, contract_status, contract_total, deposit_amount, balance_due, deposit_paid, event_date, balance_due_date")
    .eq("inquiry_id", id)
    .maybeSingle();
  const { data: relatedInvoices } = await supabaseAdmin
    .from("client_documents")
    .select("id, document_number, status")
    .eq("inquiry_id", id)
    .eq("document_type", "invoice")
    .order("created_at", { ascending: false })
    .limit(1);
  const relatedInvoice = relatedInvoices?.[0] ?? null;

  const { data: activityLog } = await supabaseAdmin
    .from("activity_log")
    .select("id, created_at, action, summary")
    .eq("entity_type", "inquiry")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: customerInteractions } = await supabaseAdmin
    .from("customer_interactions")
    .select("id, subject, body_text, created_at, direction, metadata")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: followUpTasks } = await supabaseAdmin
    .from("crm_follow_up_tasks")
    .select("id, title, detail, task_kind, status, due_at, created_at")
    .eq("inquiry_id", id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: workflowTransitions } = await supabaseAdmin
    .from("workflow_transitions")
    .select("id, from_stage, to_stage, source_action, note, created_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: sameDayCount } = inquiry.event_date
    ? await supabaseAdmin
        .from("event_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("event_date", inquiry.event_date)
    : { count: 0 };

  const otherEventsOnDate = Math.max((sameDayCount ?? 0) - 1, 0);
  const selectedDecorCategories = Array.isArray(inquiry.selected_decor_categories)
    ? (inquiry.selected_decor_categories as string[])
    : [];
  const decorSelections = Array.isArray(inquiry.decor_selections)
    ? (inquiry.decor_selections as Array<{
        categoryKey: string;
        categoryTitle: string;
        refinement?: string | null;
        sizeOption?: string | null;
        floralDensity?: string | null;
        colorPalette?: string | null;
        inspirationLink?: string | null;
        designerLed?: boolean;
        selectedGalleryImages?: Array<{
          id: string;
          title: string;
          image_url: string;
          category?: string | null;
        }>;
        uploadedImageUrls?: string[];
        notes?: string | null;
      }>)
    : [];
  const structuredFollowUp = normalizeInquiryFollowUpDetails(inquiry.follow_up_details_json);
  const followUpNeedsReview = inquiryFollowUpNeedsReview(structuredFollowUp);
  const fallbackStyleDirection = extractLabeledSection(inquiry.inspiration_notes, "Style direction");
  const fallbackInspirationLinks =
    extractLabeledSection(inquiry.inspiration_notes, "Inspiration links")
      ?.split("\n")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  const postSubmissionStyleDirection =
    structuredFollowUp?.selected_styles?.length
      ? structuredFollowUp.selected_styles.join(", ")
      : fallbackStyleDirection;
  const postSubmissionInspirationLinks =
    structuredFollowUp?.inspiration_links?.length
      ? structuredFollowUp.inspiration_links
      : fallbackInspirationLinks;
  const postSubmissionUploadedUrls =
    structuredFollowUp?.uploaded_urls?.length
      ? structuredFollowUp.uploaded_urls
      : inquiry.vision_board_urls ?? [];
  const originalInspirationNotes = removeLabeledSections(inquiry.inspiration_notes, [
    "Style direction",
    "Inspiration links",
  ]);
  const followUpSummary = structuredFollowUp?.note ?? extractLabeledSection(inquiry.additional_info, "Follow-up");
  const originalAdditionalInfo = removeLabeledSections(inquiry.additional_info, ["Follow-up"]);
  const hasPostSubmissionInspiration =
    Boolean(postSubmissionStyleDirection) ||
    postSubmissionInspirationLinks.length > 0 ||
    Boolean(followUpSummary) ||
    Boolean(postSubmissionUploadedUrls.length);
  const bookingStage: BookingStage = deriveBookingStage({
    bookingStage: inquiry.booking_stage,
    inquiryStatus: inquiry.status,
    consultationStatus: inquiry.consultation_status,
    quoteResponseStatus: inquiry.quote_response_status,
    contractStatus: linkedContract?.contract_status,
    depositPaid: linkedContract?.deposit_paid,
    completedAt: inquiry.completed_at,
  });
  const overbookingLabel = getBookingWarningLabel(otherEventsOnDate);
  const workflow = getWorkflowState({
    status: inquiry.status,
    consultationStatus: inquiry.consultation_status,
    quoteResponseStatus: inquiry.quote_response_status,
    quotedAt: inquiry.quoted_at,
    contractStatus: linkedContract?.contract_status,
    depositPaid: linkedContract?.deposit_paid,
  });
  const primaryWorkflowAction = getInquiryWorkflowPrimaryAction({
    inquiryId: inquiry.id,
    contractId: linkedContract?.id ?? null,
    status: inquiry.status,
    consultation_status: inquiry.consultation_status,
    booking_stage: inquiry.booking_stage,
    quote_response_status: inquiry.quote_response_status,
    quoted_at: inquiry.quoted_at,
    contract_status: linkedContract?.contract_status,
    deposit_paid: linkedContract?.deposit_paid,
    completed_at: inquiry.completed_at,
  });
  const secondaryWorkflowAction = getInquiryWorkflowSecondaryAction({
    inquiryId: inquiry.id,
    contractId: linkedContract?.id ?? null,
    status: inquiry.status,
    consultation_status: inquiry.consultation_status,
    booking_stage: inquiry.booking_stage,
    quote_response_status: inquiry.quote_response_status,
    quoted_at: inquiry.quoted_at,
    contract_status: linkedContract?.contract_status,
    deposit_paid: linkedContract?.deposit_paid,
    completed_at: inquiry.completed_at,
  });
  const latestQuoteClientResponse =
    customerInteractions?.find((entry) => {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as { source?: string; action?: string })
          : null;

      return (
        entry.direction === "inbound" &&
        metadata?.source === "quote_email_action" &&
        (metadata.action === "approve" || metadata.action === "request_changes")
      );
    }) ?? null;
  const latestQuoteFollowUpTask =
    followUpTasks?.find((task) =>
      task.task_kind === "quote_changes" || task.task_kind === "quote_approval"
    ) ?? null;
  const showQuoteResponsePanel =
    inquiry.quote_response_status === "changes_requested" ||
    inquiry.quote_response_status === "accepted" ||
    Boolean(latestQuoteClientResponse);
  const quoteResponseTone =
    inquiry.quote_response_status === "changes_requested" ? "warning" : "success";
  const quoteResponseTitle =
    inquiry.quote_response_status === "changes_requested"
      ? "Client requested quote changes"
      : inquiry.quote_response_status === "accepted"
        ? "Client approved the quote"
        : "Recent client quote response";
  const quoteResponseDetail =
    latestQuoteClientResponse?.body_text ??
    (inquiry.quote_response_status === "changes_requested"
      ? "The client responded from the quote email and requested changes to the current pricing or scope."
      : "The client responded from the quote email and approved the current proposal.");

  const unifiedTimeline = buildCustomerTimeline({
    workflowTransitions,
    activityLog,
    customerInteractions,
    followUpTasks,
    recordHref: buildInquiryDetailHref(inquiry.id),
    workflowHref: buildInquiryDetailHref(inquiry.id),
    contractHref: linkedContract?.id ? buildContractDetailHref(linkedContract.id) : null,
  }).slice(0, 24);

  return (
    <main className="container section">
      <div style={{ marginBottom: "20px" }}>
        <Link href={buildInquiryWorkspaceHref({ tab: "inquiries" })} className="btn secondary">
          ← Back to Inquiries
        </Link>
      </div>

      <h2>Inquiry CRM View</h2>
      <p className="lead">
        Review the client, event scope, and next sales action in one place.
      </p>

      <div className="crm-overview">
        <div className="crm-hero-card card">
          <p className="eyebrow">Lead summary</p>
          <h3>{inquiry.first_name} {inquiry.last_name}</h3>
          <p className="muted">
            {inquiry.event_type} {inquiry.event_date ? `• ${inquiry.event_date}` : ""} {inquiry.venue_name ? `• ${inquiry.venue_name}` : ""}
          </p>
          <div className="summary-pills">
            <span className="summary-chip">Status: {inquiry.status ?? "new"}</span>
            <span className="summary-chip">Booking: {humanizeBookingStage(bookingStage)}</span>
            <span className="summary-chip">Quote: ${Number(inquiry.estimated_price ?? 0).toLocaleString()}</span>
            <span className="summary-chip">Guest count: {inquiry.guest_count ?? "—"}</span>
            <span className="summary-chip">Consultation: {inquiry.consultation_status ?? "not_scheduled"}</span>
            <span className="summary-chip">Owner: {inquiry.crm_owner?.trim() || "Unassigned"}</span>
            <span className="summary-chip">Next action: {inquiry.crm_next_action?.trim() || "Not set"}</span>
            <span className="summary-chip">Lead score: {inquiry.crm_lead_score ?? "Not set"}</span>
            <span className="summary-chip">Temperature: {inquiry.crm_lead_temperature ?? "Not set"}</span>
            {hasUnmatchedReplyCandidate ? (
              <Link href={unmatchedReplyReviewHref} className="summary-chip">
                Unmatched reply candidate: {unmatchedReplyCandidates.length}
              </Link>
            ) : null}
            {inquiry.status === "closed_lost" ? (
              <span className="summary-chip">Lost reason: {inquiry.lost_reason ?? "Not set"}</span>
            ) : null}
            {inquiry.status === "closed_lost" && inquiry.crm_lost_at ? (
              <span className="summary-chip">
                Lost at: {new Date(inquiry.crm_lost_at).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="crm-timeline card">
          <p className="eyebrow">Current workflow</p>
          <div className="timeline-row neutral">
            <strong>Workflow stage</strong>
            <span>{humanizeLabel(inquiry.workflow_stage ?? workflow.currentStep)}</span>
          </div>
          <div className="timeline-row active">
            <strong>Booking stage</strong>
            <span>{humanizeBookingStage(bookingStage)}</span>
          </div>
          <div className="timeline-row neutral">
            <strong>Quote response</strong>
            <span>{humanizeLabel(inquiry.quote_response_status ?? "not_sent")}</span>
          </div>
          <div className="timeline-row neutral">
            <strong>Contract</strong>
            <span>{linkedContract?.contract_status ? humanizeLabel(linkedContract.contract_status) : "Not created"}</span>
          </div>
        </div>
      </div>

      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <div className="card metric-card metric-card--blue">
          <p className="muted">Consultation</p>
          <strong>{humanizeLabel(inquiry.consultation_status ?? "not_scheduled")}</strong>
          <span>{inquiry.consultation_at ? new Date(inquiry.consultation_at).toLocaleString() : "No meeting scheduled yet"}</span>
        </div>
        <div className="card metric-card metric-card--violet">
          <p className="muted">Quote / Pricing</p>
          <strong>${Number(inquiry.estimated_price ?? 0).toLocaleString()}</strong>
          <span>{humanizeLabel(inquiry.quote_response_status ?? "not_sent")}</span>
        </div>
        <div className="card metric-card metric-card--green">
          <p className="muted">Contract Status</p>
          <strong>{linkedContract?.contract_status ? humanizeLabel(linkedContract.contract_status) : "Not created"}</strong>
          <span>{linkedContract ? `Deposit ${linkedContract.deposit_paid ? "paid" : "pending"}` : "Create after scope is approved"}</span>
        </div>
        <div className="card metric-card metric-card--amber">
          <p className="muted">Email Automation</p>
          <strong>{inquiry.consultation_request_confirmation_sent_at ? "Active" : "Pending"}</strong>
          <span>{inquiry.consultation_schedule_email_sent_at ? "Meeting email sent" : "Meeting email not sent yet"}</span>
        </div>
      </div>

      <section className="admin-record-section">
        <div className="admin-section-title">
          <h3>Workflow control</h3>
          <p className="muted">
            Use this as the single operating path from new inquiry to booked-event handoff.
          </p>
        </div>

        <div className="admin-workflow-shell">
          <div className="card admin-workflow-summary">
            <p className="eyebrow">Current step</p>
            <h3>{workflow.nextActionTitle}</h3>
            <p className="muted">{workflow.nextActionDetail}</p>
            <div className="admin-workflow-summary-actions">
              <AdminWorkflowAction
                href={primaryWorkflowAction.href}
                tone={primaryWorkflowAction.tone}
                label={primaryWorkflowAction.label}
                description={primaryWorkflowAction.description}
              />
              {secondaryWorkflowAction ? (
                <AdminWorkflowAction
                  href={secondaryWorkflowAction.href}
                  tone={secondaryWorkflowAction.tone}
                  label={secondaryWorkflowAction.label}
                  description={secondaryWorkflowAction.description}
                />
              ) : null}
            </div>
            <div className="summary-pills">
              <span className="summary-chip">
                Lead status: {humanizeLabel(inquiry.status ?? "new")}
              </span>
              <span className="summary-chip">
                Consultation: {humanizeLabel(inquiry.consultation_status ?? "not_scheduled")}
              </span>
              <span className="summary-chip">
                Quote: {humanizeLabel(inquiry.quote_response_status ?? "not_sent")}
              </span>
              <span className="summary-chip">
                Contract: {linkedContract?.contract_status ? humanizeLabel(linkedContract.contract_status) : "Not created"}
              </span>
              {hasUnmatchedReplyCandidate ? (
                <Link href={unmatchedReplyReviewHref} className="summary-chip">
                  Review unmatched reply
                </Link>
              ) : null}
            </div>
          </div>

          <div className="card admin-workflow-track">
            {workflow.steps.map((step, index) => (
              <div
                key={step.key}
                className={`admin-workflow-step admin-workflow-step--${step.state}`}
              >
                <div className="admin-workflow-step-index">
                  {index + 1}
                </div>
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showQuoteResponsePanel ? (
        <section className="admin-record-section">
          <div className="admin-section-title">
            <h3>Client quote response</h3>
            <p className="muted">
              Keep the client reply visible here so the owner knows exactly what needs to happen next.
            </p>
          </div>

          <div className={`card admin-customer-response-card admin-customer-response-card--${quoteResponseTone}`}>
            <div className="admin-customer-response-head">
              <div>
                <p className="eyebrow">Customer action</p>
                <h3>{quoteResponseTitle}</h3>
              </div>
              <span className="summary-chip">
                {humanizeLabel(inquiry.quote_response_status ?? "not_sent")}
              </span>
            </div>

            <div className="admin-customer-response-grid">
              <div className="admin-customer-response-message">
                <strong>Customer message</strong>
                <p>{quoteResponseDetail}</p>
                <span>
                  {latestQuoteClientResponse?.created_at
                    ? `Received ${new Date(latestQuoteClientResponse.created_at).toLocaleString()}`
                    : "Awaiting customer message details"}
                </span>
              </div>

              <div className="admin-customer-response-message">
                <strong>Internal next step</strong>
                <p>
                  {latestQuoteFollowUpTask?.title ??
                    (inquiry.quote_response_status === "changes_requested"
                      ? "Revise the quote and send an updated itemized proposal."
                      : "Prepare the contract, deposit request, and booking follow-up.") }
                </p>
                <span>
                  {latestQuoteFollowUpTask?.detail ??
                    (inquiry.quote_response_status === "changes_requested"
                      ? "This request stays in the quote stage until the revised quote is sent."
                      : "This request can now move into contract and deposit handling.") }
                </span>
              </div>
            </div>

            <div className="summary-pills">
              <a href="#quote-stage" className="summary-chip">
                {inquiry.quote_response_status === "changes_requested" ? "Open quote revision" : "Open quote stage"}
              </a>
              <a
                href={inquiry.quote_response_status === "accepted" ? "#contract-stage" : "#next-action"}
                className="summary-chip"
              >
                {inquiry.quote_response_status === "accepted" ? "Move to contract" : "Review next actions"}
              </a>
              <Link href={buildCrmLeadDetailHref(inquiry.id)} className="summary-chip">
                Open CRM record
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {hasUnmatchedReplyCandidate ? (
        <section className="admin-record-section">
          <div className="admin-section-title">
            <h3>Unmatched reply candidate</h3>
            <p className="muted">
              A pending inbound reply strongly suggests this inquiry and is waiting for manual attachment review.
            </p>
          </div>

          <div className="card admin-customer-response-card admin-customer-response-card--attention">
            <div className="admin-customer-response-head">
              <div>
                <p className="eyebrow">Email review</p>
                <h3>{unmatchedReplyCandidates.length === 1 ? "One reply is waiting on this inquiry" : `${unmatchedReplyCandidates.length} replies are waiting on this inquiry`}</h3>
              </div>
              <span className="summary-chip">Strong suggestion</span>
            </div>

            <div className="admin-customer-response-grid">
              <div className="admin-customer-response-message">
                <strong>Latest pending reply</strong>
                <p>{unmatchedReplyCandidates[0]?.subject?.trim() || "No subject"}</p>
                <span>From {unmatchedReplyCandidates[0]?.fromEmail ?? inquiry.email ?? "Unknown sender"}</span>
              </div>

              <div className="admin-customer-response-message">
                <strong>Internal next step</strong>
                <p>Open reply review and attach the inbound message to this inquiry if it is the correct opportunity.</p>
                <span>This protects the CRM timeline from email-only guesswork.</span>
              </div>
            </div>

            <div className="summary-pills">
              <Link href={unmatchedReplyReviewHref} className="summary-chip">
                Open reply review
              </Link>
              <Link href={buildCrmLeadDetailHref(inquiry.id)} className="summary-chip">
                Open CRM record
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="card admin-visual-review-board">
        <div className="admin-visual-review-head">
          <div>
            <p className="eyebrow">Meeting board</p>
            <h3>Customer visual direction</h3>
            <p className="muted">
              Review the exact inspiration the client selected or uploaded before the consultation starts.
            </p>
          </div>
        </div>

        {decorSelections.length ? (
          <div className="admin-decor-selection-list">
            {decorSelections.map((selection) => {
              const selectedImages = selection.selectedGalleryImages ?? [];
              const uploadedImages = selection.uploadedImageUrls ?? [];

              return (
                <div key={selection.categoryKey} className="admin-decor-selection-card">
                  <div className="admin-decor-selection-head">
                    <strong>{selection.categoryTitle}</strong>
                    <span>
                      {selectedImages.length + uploadedImages.length
                        ? `${selectedImages.length + uploadedImages.length} visual reference${selectedImages.length + uploadedImages.length === 1 ? "" : "s"}`
                        : "Notes only"}
                    </span>
                  </div>

                  {selectedImages.length ? (
                    <div className="admin-decor-selection-section">
                      <strong>Selected gallery references</strong>
                      <div className="admin-decor-selection-images">
                        {selectedImages.map((image) => (
                          <a key={image.id} href={image.image_url} target="_blank" rel="noreferrer">
                            <img src={image.image_url} alt={image.title} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {uploadedImages.length ? (
                    <div className="admin-decor-selection-section">
                      <strong>Uploaded inspiration</strong>
                      <div className="admin-decor-selection-images admin-decor-selection-images--uploads">
                        {uploadedImages.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`${selection.categoryTitle} uploaded inspiration`} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selection.notes ? (
                    <div className="admin-vision-block admin-vision-block--note">
                      <strong>Client note</strong>
                      <p>{selection.notes}</p>
                    </div>
                  ) : null}

                  {selection.refinement ? (
                    <div className="admin-vision-block">
                      <strong>Refinement</strong>
                      <p>{selection.refinement}</p>
                    </div>
                  ) : null}

                  {(selection.sizeOption || selection.floralDensity || selection.colorPalette || selection.inspirationLink || selection.designerLed) ? (
                    <div className="admin-vision-block">
                      <strong>Styling preferences</strong>
                      <p>
                        {[
                          selection.designerLed ? "Elel-led design requested" : "",
                          selection.sizeOption ? `Size: ${selection.sizeOption}` : "",
                          selection.floralDensity ? `Floral density: ${selection.floralDensity}` : "",
                          selection.colorPalette ? `Palette: ${selection.colorPalette}` : "",
                        ].filter(Boolean).join(" • ")}
                      </p>
                      {selection.inspirationLink ? (
                        <p>
                          <a href={selection.inspirationLink} target="_blank" rel="noreferrer">
                            {selection.inspirationLink}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">No structured visual selections were submitted.</p>
        )}
      </div>

      <section className="admin-record-section">
        <div className="admin-section-title">
          <h3>Request Overview</h3>
          <p className="muted">Keep the client, event, consultation, and payment context visible in one place.</p>
        </div>

      <div className="grid-2">
        <div className="card">
          <h3>Client Information</h3>
          <p><strong>Name:</strong> {inquiry.first_name} {inquiry.last_name}</p>
          <p><strong>Email:</strong> {inquiry.email}</p>
          <p><strong>Phone:</strong> {inquiry.phone}</p>
          <p><strong>Preferred Contact:</strong> {inquiry.preferred_contact_method ?? "—"}</p>
          <p><strong>Requested Consultation Day:</strong> {inquiry.consultation_request_date ?? "—"}</p>
          <p><strong>Requested Consultation Time:</strong> {inquiry.consultation_request_time ?? "—"}</p>
          <p><strong>Video Platform:</strong> {inquiry.consultation_video_platform ?? "—"}</p>
          <p><strong>Consultation Request Email Sent:</strong> {inquiry.consultation_request_confirmation_sent_at ? new Date(inquiry.consultation_request_confirmation_sent_at).toLocaleString() : "Not yet"}</p>
          <p><strong>Referral Source:</strong> {inquiry.referral_source ?? "—"}</p>
        </div>

        <div className="card">
          <h3>Consultation Information</h3>
          <p><strong>Event Type:</strong> {inquiry.event_type}</p>
          <p><strong>Event Date:</strong> {inquiry.event_date ?? "—"}</p>
          <p><strong>Guest Count:</strong> {inquiry.guest_count ?? "—"}</p>
          <p><strong>Venue Name:</strong> {inquiry.venue_name ?? "—"}</p>
          <p><strong>Venue Status:</strong> {inquiry.venue_status ?? "—"}</p>
          <p><strong>Indoor / Outdoor:</strong> {inquiry.indoor_outdoor ?? "—"}</p>
          <p><strong>Consultation Type:</strong> {inquiry.consultation_type ?? "—"}</p>
          <p><strong>Consultation At:</strong> {inquiry.consultation_at ? new Date(inquiry.consultation_at).toLocaleString() : "—"}</p>
          <p><strong>Consultation Location:</strong> {inquiry.consultation_location ?? "—"}</p>
          <p><strong>Video Link:</strong> {inquiry.consultation_video_link ?? "—"}</p>
          <p><strong>Consultation Admin Notes:</strong> {inquiry.consultation_admin_notes ?? "—"}</p>
          <p><strong>Meeting Email Sent:</strong> {inquiry.consultation_schedule_email_sent_at ? new Date(inquiry.consultation_schedule_email_sent_at).toLocaleString() : "Not yet"}</p>
          <p><strong>Follow-Up At:</strong> {inquiry.follow_up_at ? new Date(inquiry.follow_up_at).toLocaleString() : "—"}</p>
          <p><strong>Booking Status:</strong> {humanizeBookingStage(bookingStage)}</p>
          <p><strong>Floor Plan:</strong> {inquiry.floor_plan_received ? "Received" : "Pending"}</p>
          <p><strong>Walkthrough:</strong> {inquiry.walkthrough_completed ? "Completed" : "Pending"}</p>
          {overbookingLabel ? (
            <p><strong>Scheduling Warning:</strong> {overbookingLabel}</p>
          ) : null}
        </div>

        <div className="card">
          <h3>Quote, Contract, and Payment</h3>
          <div className="summary-pills" style={{ marginBottom: "14px" }}>
            <Link href={buildQuoteCreateHref({ inquiryId: inquiry.id })} className="summary-chip">
              Create Quote Document
            </Link>
            {linkedContract ? (
              <Link
                href={buildInvoiceCreateHref({
                  inquiryId: inquiry.id,
                  contractId: linkedContract.id,
                })}
                className="summary-chip"
              >
                Create Invoice Document
              </Link>
            ) : null}
            {relatedInvoice ? (
              <>
                <Link
                  href={buildDocumentDetailHref(relatedInvoice.id)}
                  className="summary-chip"
                >
                  Open Invoice
                </Link>
                <Link
                  href={buildDocumentDetailHref(relatedInvoice.id, {
                    openPayment: true,
                    paymentMethod: "cash",
                  })}
                  className="summary-chip"
                >
                  Record Cash Payment
                </Link>
                <Link
                  href={buildDocumentDetailHref(relatedInvoice.id, {
                    openPayment: true,
                  })}
                  className="summary-chip"
                >
                  Open Payment Entry
                </Link>
              </>
            ) : null}
          </div>
          <p><strong>Colors / Theme:</strong> {inquiry.colors_theme ?? "—"}</p>
          <p><strong>Selected Decor Elements:</strong></p>
          <div className="summary-pills">
            {selectedDecorCategories.length ? (
              selectedDecorCategories.map((category) => (
                <span key={category} className="summary-chip">{category.replace(/_/g, " ")}</span>
              ))
            ) : (
              <p className="muted">No decor elements selected yet.</p>
            )}
          </div>
          <div className="summary-pills">
            {inquiry.services?.length
              ? inquiry.services.map((service: string) => (
                  <span key={service} className="summary-chip">{service}</span>
                ))
              : <p className="muted">No decor items selected.</p>}
          </div>
          <p><strong>Needs Delivery / Setup:</strong> {inquiry.needs_delivery_setup ? "Yes" : "No"}</p>
          <p><strong>Current Quote Amount:</strong> ${inquiry.estimated_price ?? 0}</p>
          <p><strong>Quote Response:</strong> {inquiry.quote_response_status ?? "not_sent"}</p>
          {linkedContract ? (
            <>
              <p><strong>Contract:</strong> {linkedContract.contract_status ?? "draft"}</p>
              <p><strong>Contract Total:</strong> ${Number(linkedContract.contract_total ?? 0).toLocaleString()}</p>
              <p><strong>Deposit Amount:</strong> ${Number(linkedContract.deposit_amount ?? 0).toLocaleString()}</p>
              <p><strong>Deposit:</strong> {linkedContract.deposit_paid ? "Paid" : "Pending"}</p>
              <p><strong>Remaining Balance:</strong> ${Number(linkedContract.balance_due ?? 0).toLocaleString()}</p>
              <p><strong>Balance Due Date:</strong> {linkedContract.balance_due_date ?? "—"}</p>
            </>
          ) : null}
          <p><strong>Invoice Payment Entry:</strong> {relatedInvoice ? "Ready" : "Create invoice first"}</p>
        </div>

        <div className="card">
          <h3>Client Vision Summary</h3>
          <div className="admin-vision-summary">
            <div className="admin-vision-block">
              <strong>Inspiration Notes</strong>
              <p>{originalInspirationNotes ?? "—"}</p>
            </div>
            <div className="admin-vision-block">
              <strong>Additional Info</strong>
              <p>{originalAdditionalInfo ?? "—"}</p>
            </div>
            <div className="admin-vision-block">
              <strong>All Uploaded Inspiration</strong>
              {inquiry.vision_board_urls?.length ? (
                <div className="vision-board-grid vision-board-grid--admin">
                  {inquiry.vision_board_urls.map((url: string) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="vision-board-item vision-board-item--admin"
                    >
                      <img src={url} alt="Client inspiration upload" />
                    </a>
                  ))}
                </div>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </section>

      {hasPostSubmissionInspiration ? (
        <section className="admin-record-section">
          <div className="admin-section-title">
            <h3>Post-submission inspiration</h3>
            <p className="muted">
              These details were added after the initial availability request and should guide the consultation review.
            </p>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Style and links</h3>
              <FollowUpReviewForm
                inquiryId={inquiry.id}
                isReviewed={!followUpNeedsReview}
                reviewedAt={structuredFollowUp?.reviewed_at ?? null}
              />
              <div className="admin-vision-summary">
                <div className="admin-vision-block">
                  <strong>Style direction</strong>
                  <p>{postSubmissionStyleDirection ?? "—"}</p>
                </div>
                <div className="admin-vision-block">
                  <strong>Inspiration links</strong>
                  {postSubmissionInspirationLinks.length ? (
                    <div className="summary-pills">
                      {postSubmissionInspirationLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="summary-chip"
                        >
                          Open link
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p>—</p>
                  )}
                </div>
                <div className="admin-vision-block">
                  <strong>Follow-up note</strong>
                  <p>{followUpSummary ?? "Client added inspiration after the initial submission."}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Follow-up uploads</h3>
              {postSubmissionUploadedUrls.length ? (
                <div className="vision-board-grid vision-board-grid--admin">
                  {postSubmissionUploadedUrls.map((url: string) => (
                    <a
                      key={`follow-up-${url}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="vision-board-item vision-board-item--admin"
                    >
                      <img src={url} alt="Post-submission inspiration upload" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="muted">No uploaded follow-up inspiration yet.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <CustomerTimeline
        eyebrow="Client timeline"
        title="Workflow, replies, and admin activity"
        description="One shared history for workflow movement, client replies, admin actions, and follow-up tasks."
        items={unifiedTimeline}
        emptyMessage="No workflow or client activity has been recorded yet."
      />

      <section id="next-action" className="admin-record-section">
        <div className="admin-section-title">
          <h3>Next-step actions</h3>
          <p className="muted">
            Work the request in order. Each block owns one stage of the client journey.
          </p>
        </div>

        <div className="admin-workflow-actions">
          <div id="intake-stage" className={`card admin-workflow-action-card${workflow.currentStep === "intake" ? " is-current" : ""}`}>
            <div className="admin-workflow-action-head">
              <div>
                <p className="eyebrow">Step 1</p>
                <h3>Review and qualify the request</h3>
                <p className="muted">Set the lead status and capture internal notes before moving deeper into planning.</p>
              </div>
            </div>
            <InquiryStatusForm
              inquiryId={inquiry.id}
              currentStatus={inquiry.status ?? "new"}
              currentNotes={inquiry.admin_notes ?? ""}
              currentOwner={inquiry.crm_owner ?? null}
              currentLostReason={inquiry.lost_reason ?? null}
              currentNextAction={inquiry.crm_next_action ?? null}
              currentNextActionDueAt={inquiry.crm_next_action_due_at ?? null}
              currentLeadScore={inquiry.crm_lead_score ?? null}
              currentLeadTemperature={inquiry.crm_lead_temperature ?? null}
              currentLostContext={inquiry.crm_lost_context ?? null}
            />
          </div>

          <div id="consultation-stage" className={`card admin-workflow-action-card${workflow.currentStep === "consultation" ? " is-current" : ""}`}>
            <div className="admin-workflow-action-head">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>Consultation planning</h3>
                <p className="muted">Schedule the meeting, keep follow-up timing visible, and record consultation outcomes here.</p>
              </div>
            </div>
            <ConsultationManagementForm
              inquiryId={inquiry.id}
              initialConsultationStatus={inquiry.consultation_status ?? "not_scheduled"}
              initialConsultationType={inquiry.consultation_type ?? null}
              initialConsultationAt={inquiry.consultation_at ?? null}
              initialConsultationLocation={inquiry.consultation_location ?? null}
              initialConsultationVideoLink={inquiry.consultation_video_link ?? null}
              initialConsultationAdminNotes={inquiry.consultation_admin_notes ?? null}
              initialFollowUpAt={inquiry.follow_up_at ?? null}
              initialQuoteResponseStatus={inquiry.quote_response_status ?? "not_sent"}
            />
          </div>

          <div id="quote-stage" className={`card admin-workflow-action-card${workflow.currentStep === "quote" ? " is-current" : ""}`}>
            <div className="admin-workflow-action-head">
              <div>
                <p className="eyebrow">Step 3</p>
                <h3>Quote and proposal</h3>
                <p className="muted">Build the itemized proposal, save internal drafts, and send the client-facing quote from one place.</p>
              </div>
            </div>
            <QuoteManagementForm
              inquiryId={inquiry.id}
              currentAmount={inquiry.estimated_price ?? null}
              clientEmail={inquiry.email ?? null}
              clientName={`${inquiry.first_name} ${inquiry.last_name}`}
              eventType={inquiry.event_type ?? null}
              eventDate={inquiry.event_date ?? null}
              catalogItems={pricingCatalogItems ?? []}
              initialPricing={inquiryQuotePricing ?? null}
              initialLineItems={inquiryQuoteLineItems ?? []}
            />
          </div>

          <div id="contract-stage" className={`card admin-workflow-action-card${workflow.currentStep === "contract" ? " is-current" : ""}`}>
            <div className="admin-workflow-action-head">
              <div>
                <p className="eyebrow">Step 4</p>
                <h3>Contract and booking confirmation</h3>
                <p className="muted">Once scope is approved, create the contract and move the client toward deposit and reservation.</p>
              </div>
            </div>
            <CreateContractButton inquiryId={inquiry.id} />
          </div>

          <div id="handoff-stage" className={`card admin-workflow-action-card${workflow.currentStep === "handoff" ? " is-current" : ""}`}>
            <div className="admin-workflow-action-head">
              <div>
                <p className="eyebrow">Step 5</p>
                <h3>Booked-event handoff</h3>
                <p className="muted">Track floor plans, walkthroughs, vendor support, and post-booking production readiness.</p>
              </div>
            </div>
            <div id="booking-stage">
              <BookingLifecycleForm
                inquiryId={inquiry.id}
                initialBookingStage={bookingStage}
                initialFloorPlanReceived={Boolean(inquiry.floor_plan_received)}
                initialWalkthroughCompleted={Boolean(inquiry.walkthrough_completed)}
                eventDate={inquiry.event_date ?? null}
                otherEventsOnDate={otherEventsOnDate}
              />
            </div>
            <VendorReferralForm
              inquiryId={inquiry.id}
              initialRequestedCategories={inquiry.requested_vendor_categories ?? []}
              initialVendorRequestNotes={inquiry.vendor_request_notes ?? null}
              vendors={vendors ?? []}
              existingReferrals={vendorReferrals ?? []}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
