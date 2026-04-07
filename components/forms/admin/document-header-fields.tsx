"use client";

import {
  documentStatusOptions,
  documentTypeLabels,
  type ClientDocumentType,
  type ClientDocumentStatus,
} from "@/lib/client-documents";

export default function DocumentHeaderFields({
  documentType,
  documentNumber,
  status,
  issueDate,
  dueDate,
  expirationDate,
  onChange,
}: {
  documentType: ClientDocumentType;
  documentNumber: string;
  status: ClientDocumentStatus;
  issueDate: string | null;
  dueDate: string | null;
  expirationDate: string | null;
  onChange: (
    key:
      | "document_number"
      | "status"
      | "issue_date"
      | "due_date"
      | "expiration_date",
    value: string | null
  ) => void;
}) {
  return (
    <section className="card admin-document-section">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Document Header</p>
          <h3>{documentTypeLabels[documentType]}</h3>
        </div>
      </div>

      <div className="admin-document-grid">
        <div className="field">
          <label className="label">Document Number</label>
          <input
            className="input"
            value={documentNumber}
            onChange={(event) => onChange("document_number", event.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Status</label>
          <select
            className="input"
            value={status}
            onChange={(event) =>
              onChange("status", event.target.value as ClientDocumentStatus)
            }
          >
            {documentStatusOptions[documentType].map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Issue Date</label>
          <input
            className="input"
            type="date"
            value={issueDate ?? ""}
            onChange={(event) => onChange("issue_date", event.target.value || null)}
          />
        </div>

        {documentType === "quote" ? (
          <div className="field">
            <label className="label">Expiration Date</label>
            <input
              className="input"
              type="date"
              value={expirationDate ?? ""}
              onChange={(event) =>
                onChange("expiration_date", event.target.value || null)
              }
            />
          </div>
        ) : (
          <div className="field">
            <label className="label">Due Date</label>
            <input
              className="input"
              type="date"
              value={dueDate ?? ""}
              onChange={(event) => onChange("due_date", event.target.value || null)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
