"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  return (
    <div className="admin-record-section">
      <div className="card admin-table-card admin-management-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Document records</p>
            <h3>Quotes, invoices, and receipts</h3>
            <p className="muted">
              Search and filter the document system without losing visibility into totals.
            </p>
          </div>
          <div className="admin-inline-actions">
            <Link href={buildQuoteCreateHref()} className="btn">
              Create Quote
            </Link>
          </div>
        </div>

        <div className="admin-document-filter-row">
          <input
            className="input"
            placeholder="Search client or document number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            <option value="quote">Quote</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
          </select>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="admin-inline-metrics">
          <span className="admin-head-pill">Showing {filteredDocuments.length} documents</span>
          <span className="admin-head-pill">Quotes {visibleTotals.quotes}</span>
          <span className="admin-head-pill">Invoices {visibleTotals.invoices}</span>
          <span className="admin-head-pill">Receipts {visibleTotals.receipts}</span>
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
                        <Link href={buildDocumentPdfHref(document.id)} style={{ fontWeight: 700 }} target="_blank" rel="noreferrer">
                          {document.document_number}
                        </Link>
                        <span>{document.venue_name || document.event_type || "Client document"}</span>
                      </div>
                    </td>
                    <td>{documentTypeLabels[document.document_type]}</td>
                    <td>{document.customer_name}</td>
                    <td>{formatDocumentDate(document.event_date)}</td>
                    <td>${formatMoney(document.total_amount)}</td>
                    <td><DocumentStatusBadge status={document.status} /></td>
                    <td>{formatDocumentDate(document.created_at)}</td>
                    <td>
                      <details className="admin-row-action-shell admin-document-action-shell">
                        <summary className="admin-row-action-trigger admin-row-action-trigger--text">
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

                        <div className="admin-row-action-dropdown admin-document-action-dropdown">
                          <div className="admin-row-action-group">
                            <p className="admin-row-action-group-label">Output</p>
                            <Link
                              href={buildDocumentPdfHref(document.id)}
                              className="admin-table-text-action"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open PDF
                            </Link>
                            <Link
                              href={buildDocumentOutputHref(document.id, {
                                autoprint: true,
                                intent: "print",
                              })}
                              className="admin-table-text-action"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Print
                            </Link>
                            <Link
                              href={buildDocumentPdfHref(document.id, {
                                download: true,
                              })}
                              className="admin-table-text-action"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download PDF
                            </Link>
                          </div>

                          <div className="admin-row-action-group">
                            <p className="admin-row-action-group-label">Record</p>
                            <Link
                              href={buildDocumentDetailHref(document.id)}
                              className="admin-table-text-action admin-table-text-action--muted"
                            >
                              Edit Document
                            </Link>
                          </div>
                        </div>
                      </details>
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
