"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildDocumentDetailHref,
  buildDocumentPdfHref,
  buildDocumentOutputHref,
  buildQuoteCreateHref,
} from "@/lib/admin-navigation";
import type { ClientDocumentRecord } from "@/lib/client-documents";
import { documentTypeLabels, formatDocumentDate, formatMoney } from "@/lib/client-documents";
import DocumentStatusBadge from "@/components/forms/admin/document-status-badge";

export default function DocumentsList({
  documents,
}: {
  documents: ClientDocumentRecord[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuDirection, setOpenMenuDirection] = useState<"down" | "up">("down");
  const [openMenuStyle, setOpenMenuStyle] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRootRef.current?.contains(target)) return;
      const openDropdown = openMenuId ? dropdownRefs.current[openMenuId] : null;
      if (openDropdown?.contains(target)) return;
      setOpenMenuId(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;

    const trigger = triggerRefs.current[openMenuId];
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const dropdown = dropdownRefs.current[openMenuId];
    const dropdownRect = dropdown?.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const estimatedHeight = dropdownRect?.height ?? 220;
    const requiredHeight = estimatedHeight + 16;
    const nextDirection =
      spaceBelow < requiredHeight && spaceAbove > spaceBelow ? "up" : "down";
    const dropdownWidth = dropdownRect?.width ?? 300;
    const viewportPadding = 16;
    const left = Math.max(
      viewportPadding,
      Math.min(triggerRect.right - dropdownWidth, window.innerWidth - dropdownWidth - viewportPadding)
    );
    const top =
      nextDirection === "up"
        ? triggerRect.top - estimatedHeight - 10
        : triggerRect.bottom + 10;

    setOpenMenuDirection(nextDirection);
    setOpenMenuStyle({
      top: Math.max(12, top),
      left,
    });
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;

    function updatePosition() {
      const trigger = triggerRefs.current[openMenuId];
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const dropdown = dropdownRefs.current[openMenuId];
      const dropdownRect = dropdown?.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const estimatedHeight = dropdownRect?.height ?? 220;
      const requiredHeight = estimatedHeight + 16;
      const nextDirection =
        spaceBelow < requiredHeight && spaceAbove > spaceBelow ? "up" : "down";
      const dropdownWidth = dropdownRect?.width ?? 300;
      const viewportPadding = 16;
      const left = Math.max(
        viewportPadding,
        Math.min(triggerRect.right - dropdownWidth, window.innerWidth - dropdownWidth - viewportPadding)
      );
      const top =
        nextDirection === "up"
          ? triggerRect.top - estimatedHeight - 10
          : triggerRect.bottom + 10;

      setOpenMenuDirection(nextDirection);
      setOpenMenuStyle({
        top: Math.max(12, top),
        left,
      });
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openMenuId]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const matchesSearch =
          !search ||
          document.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          document.document_number.toLowerCase().includes(search.toLowerCase());
        const matchesType =
          typeFilter === "all" || document.document_type === typeFilter;
        const matchesStatus =
          statusFilter === "all" || document.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [documents, search, statusFilter, typeFilter]
  );

  const visibleTotals = useMemo(
    () => ({
      quotes: filteredDocuments.filter((document) => document.document_type === "quote").length,
      invoices: filteredDocuments.filter((document) => document.document_type === "invoice").length,
      receipts: filteredDocuments.filter((document) => document.document_type === "receipt").length,
    }),
    [filteredDocuments]
  );

  const typeOptions = [
    { value: "all", label: "All types" },
    { value: "quote", label: "Quote / Proposal" },
    { value: "invoice", label: "Invoice" },
    { value: "receipt", label: "Payment Receipt" },
  ] as const;

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "paid", label: "Paid" },
    { value: "sent", label: "Sent" },
    { value: "draft", label: "Draft" },
  ] as const;

  return (
    <div className="admin-record-section" ref={menuRootRef}>
      <div className="card admin-table-card admin-management-card admin-documents-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Quotes, invoices, and receipts</p>
            <h3>Quotes, invoices, and receipts</h3>
            <p className="muted">
              Search and filter the document system without touching visibility into status
            </p>
          </div>
          <div className="admin-inline-actions">
            <Link href={buildQuoteCreateHref()} className="btn admin-documents-create-btn">
              Create Quote
            </Link>
          </div>
        </div>

        <div className="admin-document-filter-row admin-document-filter-row--reference">
          <input
            className="input"
            placeholder="Search client or document number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-documents-head-pills">
          <span className="admin-documents-head-pill admin-documents-head-pill--strong">
            Showing {filteredDocuments.length} documents
          </span>
          <span className="admin-documents-head-pill">Quotes</span>
          <span className="admin-documents-head-pill">{visibleTotals.quotes}</span>
          <span className="admin-documents-head-pill">Invoices</span>
          <span className="admin-documents-head-pill">{visibleTotals.invoices}</span>
          <span className="admin-documents-head-pill">Receipts</span>
          <span className="admin-documents-head-pill">{visibleTotals.receipts}</span>
        </div>

        <div className="admin-documents-filter-split">
          <div className="admin-documents-chip-group">
            <p>Type</p>
            <div className="admin-documents-chip-row">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`admin-documents-chip${
                    typeFilter === option.value ? " is-active" : ""
                  }`}
                  onClick={() => setTypeFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-documents-chip-group">
            <p>Status</p>
            <div className="admin-documents-chip-row">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`admin-documents-chip${
                    statusFilter === option.value ? " is-active" : ""
                  }`}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card admin-table-card admin-records-table-card">
        <div className="admin-record-table-shell">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Client</th>
                <th>Event Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length ? (
                filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <div className="admin-record-main">
                        <Link href={buildDocumentPdfHref(document.id)} className="admin-documents-number-link" target="_blank" rel="noreferrer">
                          {document.document_number}
                        </Link>
                        <span>{document.venue_name || document.event_type || "Client document"}</span>
                      </div>
                    </td>
                    <td>{documentTypeLabels[document.document_type]}</td>
                    <td>{document.customer_name}</td>
                    <td>{formatDocumentDate(document.event_date)}</td>
                    <td className="admin-documents-amount-cell">${formatMoney(document.total_amount)}</td>
                    <td><DocumentStatusBadge status={document.status} /></td>
                    <td>{formatDocumentDate(document.created_at)}</td>
                    <td>
                      <div className="admin-row-action-shell admin-document-action-shell">
                        <button
                          type="button"
                          className="admin-row-action-trigger admin-row-action-trigger--text"
                          ref={(node) => {
                            triggerRefs.current[document.id] = node;
                          }}
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === document.id ? null : document.id
                            )
                          }
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === document.id}
                        >
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
                        </button>

                        {openMenuId === document.id && openMenuStyle
                          ? createPortal(
                              <div
                                ref={(node) => {
                                  dropdownRefs.current[document.id] = node;
                                }}
                                className={`admin-row-action-dropdown admin-row-action-dropdown--portal admin-document-action-dropdown${
                                  openMenuDirection === "up"
                                    ? " admin-row-action-dropdown--up"
                                    : ""
                                }`}
                                style={{
                                  top: `${openMenuStyle.top}px`,
                                  left: `${openMenuStyle.left}px`,
                                }}
                              >
                                <div className="admin-row-action-group">
                                  <p className="admin-row-action-group-label">Output</p>
                                  <Link
                                    href={buildDocumentPdfHref(document.id)}
                                    className="admin-table-text-action"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Open PDF
                                  </Link>
                                  <Link
                                    href={buildDocumentOutputHref(document.id, {
                                      autoprint: true,
                                      intent: "print",
                                      compact: true,
                                    })}
                                    className="admin-table-text-action"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Print
                                  </Link>
                                  <Link
                                    href={buildDocumentPdfHref(document.id, {
                                      download: true,
                                      compact: true,
                                    })}
                                    className="admin-table-text-action"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Download PDF
                                  </Link>
                                </div>

                                <div className="admin-row-action-group">
                                  <p className="admin-row-action-group-label">Record</p>
                                  <Link
                                    href={buildDocumentDetailHref(document.id)}
                                    className="admin-table-text-action admin-table-text-action--muted"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Edit Document
                                  </Link>
                                </div>
                              </div>,
                              globalThis.document.body
                            )
                          : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="admin-records-empty">
                    No documents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
