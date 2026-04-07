"use client";

import { type ClientDocumentType } from "@/lib/client-documents";

export default function DocumentNotesSection({
  documentType,
  values,
  onChange,
}: {
  documentType: ClientDocumentType;
  values: {
    notes: string | null;
    inclusions: string | null;
    exclusions: string | null;
    payment_instructions: string | null;
    payment_terms: string | null;
  };
  onChange: (key: keyof typeof values, value: string | null) => void;
}) {
  return (
    <section className="card admin-document-section">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Notes & Terms</p>
          <h3>
            {documentType === "quote"
              ? "Inclusions and next steps"
              : documentType === "invoice"
                ? "Payment instructions"
                : "Receipt notes"}
          </h3>
        </div>
      </div>

      <div className="admin-document-notes-grid">
        <div className="field">
          <label className="label">Internal / client note</label>
          <textarea
            className="input"
            rows={4}
            value={values.notes ?? ""}
            onChange={(event) => onChange("notes", event.target.value || null)}
          />
        </div>

        <div className="field">
          <label className="label">What’s included</label>
          <textarea
            className="input"
            rows={4}
            value={values.inclusions ?? ""}
            onChange={(event) => onChange("inclusions", event.target.value || null)}
          />
        </div>

        {documentType !== "receipt" ? (
          <>
            <div className="field">
              <label className="label">Exclusions / assumptions</label>
              <textarea
                className="input"
                rows={4}
                value={values.exclusions ?? ""}
                onChange={(event) => onChange("exclusions", event.target.value || null)}
              />
            </div>

            <div className="field">
              <label className="label">Payment instructions</label>
              <textarea
                className="input"
                rows={4}
                value={values.payment_instructions ?? ""}
                onChange={(event) =>
                  onChange("payment_instructions", event.target.value || null)
                }
              />
            </div>

            <div className="field field--full">
              <label className="label">Payment terms</label>
              <textarea
                className="input"
                rows={3}
                value={values.payment_terms ?? ""}
                onChange={(event) => onChange("payment_terms", event.target.value || null)}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
