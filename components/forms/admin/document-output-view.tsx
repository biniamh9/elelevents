"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import DocumentPreviewRenderer from "@/components/forms/admin/document-preview-renderer";
import { buildDocumentPdfHref } from "@/lib/admin-navigation";

export default function DocumentOutputView({
  document,
  editHref,
  indexHref,
  autoprint = false,
  intent = "view",
  compact = false,
}: {
  document: ClientDocumentWithRelations;
  editHref: string;
  indexHref: string;
  autoprint?: boolean;
  intent?: "view" | "print" | "download";
  compact?: boolean;
}) {
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    if (!autoprint || hasPrintedRef.current) {
      return;
    }

    hasPrintedRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      window.print();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [autoprint]);

  return (
    <main className="admin-document-output-page">
      <div className="admin-document-output-toolbar">
        <div className="admin-document-output-meta">
          <p className="eyebrow">Generated document output</p>
          <h1>{document.document_number}</h1>
          <p className="muted">
            {intent === "download"
              ? "Use Save as PDF in the print dialog to download the document."
              : "Open a clean printable document surface for client-ready output."}
          </p>
        </div>

        <div className="admin-document-output-actions">
          <Link href={indexHref} className="admin-topbar-pill">
            Back to Documents
          </Link>
          <Link href={editHref} className="admin-topbar-pill">
            Edit Document
          </Link>
          <Link
            href={buildDocumentPdfHref(document.id, compact ? { compact: true } : undefined)}
            className="btn secondary"
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </Link>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
          >
            Print
          </button>
          <Link
            href={buildDocumentPdfHref(document.id, {
              download: true,
              compact,
            })}
            className="btn"
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </Link>
        </div>
      </div>

      <div className="admin-document-output-sheet">
        <DocumentPreviewRenderer document={document} printCompact={compact} />
      </div>
    </main>
  );
}
