"use client";

import {
  documentStatusLabels,
  type ClientDocumentRecord,
  type ClientDocumentStatus,
} from "@/lib/client-documents";
import {
  getCommercialDocumentStatus,
  quoteWorkflowStatusLabels,
} from "@/lib/quote-workflow";

export default function DocumentStatusBadge({
  document,
  status,
  projectStatus,
}: {
  document?: ClientDocumentRecord;
  status: ClientDocumentStatus | string | null | undefined;
  projectStatus?: string | null;
}) {
  const commercialStatus = document
    ? getCommercialDocumentStatus({ document, projectStatus })
    : null;
  const tone = commercialStatus?.value ?? status ?? "draft";
  const label =
    commercialStatus?.label ??
    quoteWorkflowStatusLabels[tone as keyof typeof quoteWorkflowStatusLabels] ??
    documentStatusLabels[tone as ClientDocumentStatus] ??
    tone.replaceAll("_", " ");

  return (
    <span
      className={`document-status-badge document-status-badge--${tone}${
        commercialStatus?.className ? ` ${commercialStatus.className}` : ""
      }`}
    >
      {label}
    </span>
  );
}
