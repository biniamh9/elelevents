"use client";

import {
  documentStatusLabels,
  type ClientDocumentStatus,
} from "@/lib/client-documents";

export default function DocumentStatusBadge({
  status,
}: {
  status: ClientDocumentStatus | string | null | undefined;
}) {
  const tone = status ?? "draft";
  const label =
    documentStatusLabels[tone as ClientDocumentStatus] ??
    tone.replaceAll("_", " ");

  return (
    <span className={`document-status-badge document-status-badge--${tone}`}>
      {label}
    </span>
  );
}
