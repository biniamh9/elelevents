"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import {
  buildInquiryItemizedDraftHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import {
  getInquiryWorkflowActionGroups,
  getInquiryWorkflowPrimaryAction,
} from "@/lib/admin-workflow-lane";

export default function InquiryRecordActions({
  inquiryId,
  contractId,
  status,
  consultationStatus,
  bookingStage,
  quoteResponseStatus,
  contractStatus,
  depositPaid,
  recordCashPaymentHref,
  unmatchedReplyCandidateCount = 0,
  unmatchedReplyReviewHref,
}: {
  inquiryId: string;
  contractId?: string | null;
  status: string | null;
  consultationStatus: string | null;
  bookingStage: string | null;
  quoteResponseStatus: string | null;
  contractStatus?: string | null;
  depositPaid?: boolean | null;
  recordCashPaymentHref?: string | null;
  unmatchedReplyCandidateCount?: number;
  unmatchedReplyReviewHref?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const actionGroups = getInquiryWorkflowActionGroups({
    inquiryId,
    contractId,
    status,
    consultation_status: consultationStatus,
    booking_stage: bookingStage,
    quote_response_status: quoteResponseStatus,
    contract_status: contractStatus,
    deposit_paid: depositPaid,
  });
  const primaryAction = getInquiryWorkflowPrimaryAction({
    inquiryId,
    contractId,
    status,
    consultation_status: consultationStatus,
    booking_stage: bookingStage,
    quote_response_status: quoteResponseStatus,
    contract_status: contractStatus,
    deposit_paid: depositPaid,
  });
  const reviewHref =
    unmatchedReplyReviewHref ??
    buildUnmatchedReplyReviewHref({ status: "pending_review" });

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this inquiry record? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete inquiry.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="admin-row-actions">
      <AdminWorkflowAction
        href={primaryAction.href}
        className="admin-workflow-action--menu admin-row-action-primary"
        tone={primaryAction.tone}
        label={primaryAction.label}
        showTone={false}
        showDescription={false}
        description={primaryAction.description}
      />
      <details
        className="admin-row-action-menu"
        open={open}
        onToggle={(event) =>
          setOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary className="admin-row-action-trigger">
          <span>Actions</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="m5 7 5 6 5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="admin-row-action-dropdown">
          {actionGroups.map((group) => (
            <div key={group.title} className="admin-row-action-group">
              <p className="admin-row-action-group-label">{group.title}</p>
              {group.actions.map((action) => (
                <AdminWorkflowAction
                  key={`${group.title}-${action.label}`}
                  href={action.href}
                  className="admin-workflow-action--menu"
                  tone={group.title === "Current step" ? "internal" : "record"}
                  label={action.label}
                  showTone={false}
                  showDescription={false}
                  description={
                    group.title === "Current step"
                      ? "Open the next working area for this inquiry."
                      : group.title === "Record"
                        ? "Open the inquiry record or operating workflow."
                        : "Open the next linked admin area for this inquiry."
                  }
                />
              ))}
            </div>
          ))}
          <div className="admin-row-action-group">
            <p className="admin-row-action-group-label">Extras</p>
            {unmatchedReplyCandidateCount > 0 ? (
              <AdminWorkflowAction
                href={reviewHref}
                className="admin-workflow-action--menu"
                tone="email"
                showTone={false}
                showDescription={false}
                label={
                  unmatchedReplyCandidateCount === 1
                    ? "Review unmatched reply candidate"
                    : `Review ${unmatchedReplyCandidateCount} unmatched reply candidates`
                }
                description="A pending inbound reply strongly suggests this inquiry and needs manual attachment review."
              />
            ) : null}
            <AdminWorkflowAction
              href={buildInquiryItemizedDraftHref(inquiryId)}
              className="admin-workflow-action--menu"
              tone="internal"
              showTone={false}
              showDescription={false}
              label="Itemized Draft"
              description="Open the internal itemized quote preview for revision work."
            />
            {recordCashPaymentHref ? (
              <AdminWorkflowAction
                href={recordCashPaymentHref}
                className="admin-workflow-action--menu"
                tone="record"
                showTone={false}
                showDescription={false}
                label="Record Cash Payment"
                description="Open the invoice payment entry with cash preselected so balances and receipts update immediately."
              />
            ) : null}
          </div>
          <button
            type="button"
            className="admin-row-action-item admin-row-action-item--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </details>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
