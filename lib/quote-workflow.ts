import type { ClientDocumentRecord } from "@/lib/client-documents";
import {
  normalizeEventProjectStatus,
  type EventProjectStatus,
} from "@/lib/project-lifecycle";

type CommercialDocumentLike = Pick<
  ClientDocumentRecord,
  "document_type" | "status" | "quote_workflow_status"
>;

export const QUOTE_WORKFLOW_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "revision_requested",
  "expired",
] as const;

export type QuoteWorkflowStatus = (typeof QUOTE_WORKFLOW_STATUSES)[number];

export const quoteWorkflowStatusLabels: Record<QuoteWorkflowStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  revision_requested: "Revision Requested",
  expired: "Expired",
};

export function normalizeQuoteWorkflowStatus(
  value: string | null | undefined
): QuoteWorkflowStatus | null {
  if (!value) return null;
  return QUOTE_WORKFLOW_STATUSES.includes(value as QuoteWorkflowStatus)
    ? (value as QuoteWorkflowStatus)
    : null;
}

export function deriveQuoteWorkflowStatus(
  document: CommercialDocumentLike,
  projectStatus?: string | null
): QuoteWorkflowStatus | null {
  if (document.document_type !== "quote") return null;

  const explicit = normalizeQuoteWorkflowStatus(document.quote_workflow_status);
  if (explicit) return explicit;

  const project = normalizeEventProjectStatus(projectStatus);
  if (project === "quote_accepted" || document.status === "accepted") return "accepted";
  if (project === "quote_sent" || document.status === "sent") return "sent";
  if (project === "quote_drafted" || document.status === "draft") return "draft";
  if (document.status === "expired") return "expired";

  return "draft";
}

export function quoteWorkflowStatusToProjectStatus(
  status: QuoteWorkflowStatus
): EventProjectStatus {
  switch (status) {
    case "accepted":
      return "quote_accepted";
    case "sent":
      return "quote_sent";
    case "revision_requested":
    case "draft":
      return "quote_drafted";
    case "expired":
    default:
      return "quote_sent";
  }
}

export function quoteWorkflowStatusToDocumentStatus(
  status: QuoteWorkflowStatus
) {
  switch (status) {
    case "accepted":
      return "accepted";
    case "sent":
      return "sent";
    case "expired":
      return "expired";
    case "revision_requested":
    case "draft":
    default:
      return "draft";
  }
}

export function getCommercialDocumentStatus(input: {
  document: CommercialDocumentLike;
  projectStatus?: string | null;
}) {
  const quoteStatus = deriveQuoteWorkflowStatus(input.document, input.projectStatus);
  if (quoteStatus) {
    return {
      value: quoteStatus,
      label: quoteWorkflowStatusLabels[quoteStatus],
      className: `quote-status-badge--${quoteStatus}`,
    };
  }

  return {
    value: input.document.status,
    label: null as string | null,
    className: null as string | null,
  };
}
