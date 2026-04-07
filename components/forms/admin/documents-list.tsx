"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  return (
    <div className="card admin-table-card">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Client documents</p>
          <h3>Quotes, invoices, and receipts</h3>
        </div>
        <Link href="/admin/documents/new?type=quote" className="btn">
          Create Quote
        </Link>
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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Client</th>
              <th>Event Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((document) => (
              <tr key={document.id}>
                <td>
                  <Link href={`/admin/documents/${document.id}`} style={{ fontWeight: 700 }}>
                    {document.document_number}
                  </Link>
                </td>
                <td>{documentTypeLabels[document.document_type]}</td>
                <td>{document.customer_name}</td>
                <td>{formatDocumentDate(document.event_date)}</td>
                <td>${formatMoney(document.total_amount)}</td>
                <td><DocumentStatusBadge status={document.status} /></td>
                <td>{formatDocumentDate(document.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
