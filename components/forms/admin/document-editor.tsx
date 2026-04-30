"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ClientDocumentLineItem,
  ClientDocumentType,
  ClientDocumentWithRelations,
} from "@/lib/client-documents";
import {
  calculateDocumentTotals,
  documentTypeLabels,
  formatMoney,
} from "@/lib/client-documents";
import {
  buildDocumentOutputHref,
  buildDocumentPdfHref,
} from "@/lib/admin-navigation";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import DocumentActionBar from "@/components/forms/admin/document-action-bar";
import DocumentHeaderFields from "@/components/forms/admin/document-header-fields";
import ClientEventDetailsCard from "@/components/forms/admin/client-event-details-card";
import DocumentLineItemsTable from "@/components/forms/admin/document-line-items-table";
import PricingSummaryCard from "@/components/forms/admin/pricing-summary-card";
import DocumentNotesSection from "@/components/forms/admin/document-notes-section";
import PaymentRecordForm from "@/components/forms/admin/payment-record-form";

type EditableDocument = ClientDocumentWithRelations;

function normalizeLineItems(items: ClientDocumentLineItem[]) {
  return items.map((item, index) => ({
    ...item,
    display_order: index,
    total_price: Number((item.quantity * item.unit_price).toFixed(2)),
  }));
}

export default function DocumentEditor({
  initialDocument,
  mode,
  initialShowPaymentForm = false,
  initialPaymentMethod = "bank_transfer",
}: {
  initialDocument: EditableDocument;
  mode: "create" | "edit";
  initialShowPaymentForm?: boolean;
  initialPaymentMethod?: string;
}) {
  const router = useRouter();
  const [document, setDocument] = useState<EditableDocument>({
    ...initialDocument,
    line_items: normalizeLineItems(initialDocument.line_items),
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(initialShowPaymentForm);

  const totals = useMemo(
    () =>
      calculateDocumentTotals({
        lineItems: document.line_items,
        deliveryFee: document.delivery_fee,
        setupFee: document.setup_fee,
        discountAmount: document.discount_amount,
        taxAmount: document.tax_amount,
        amountPaid: document.amount_paid,
        depositRequired: document.deposit_required,
      }),
    [
      document.amount_paid,
      document.delivery_fee,
      document.deposit_required,
      document.discount_amount,
      document.line_items,
      document.setup_fee,
      document.tax_amount,
    ]
  );

  function updateDocument<K extends keyof EditableDocument>(key: K, value: EditableDocument[K]) {
    setDocument((current) => {
      const next = { ...current, [key]: value };
      return {
        ...next,
        subtotal: totals.subtotal,
        total_amount: totals.totalAmount,
        balance_due: totals.balanceDue,
      };
    });
  }

  function updateLineItems(nextItems: ClientDocumentLineItem[]) {
    const normalized = normalizeLineItems(nextItems);
    const nextTotals = calculateDocumentTotals({
      lineItems: normalized,
      deliveryFee: document.delivery_fee,
      setupFee: document.setup_fee,
      discountAmount: document.discount_amount,
      taxAmount: document.tax_amount,
      amountPaid: document.amount_paid,
      depositRequired: document.deposit_required,
    });
    setDocument((current) => ({
      ...current,
      line_items: normalized,
      subtotal: nextTotals.subtotal,
      total_amount: nextTotals.totalAmount,
      balance_due: nextTotals.balanceDue,
    }));
  }

  function updateMoneyField(
    key:
      | "delivery_fee"
      | "setup_fee"
      | "discount_amount"
      | "tax_amount"
      | "amount_paid"
      | "deposit_required",
    value: number
  ) {
    const nextTotals = calculateDocumentTotals({
      lineItems: document.line_items,
      deliveryFee: key === "delivery_fee" ? value : document.delivery_fee,
      setupFee: key === "setup_fee" ? value : document.setup_fee,
      discountAmount: key === "discount_amount" ? value : document.discount_amount,
      taxAmount: key === "tax_amount" ? value : document.tax_amount,
      amountPaid: key === "amount_paid" ? value : document.amount_paid,
      depositRequired:
        key === "deposit_required" ? value : document.deposit_required,
    });
    setDocument((current) => ({
      ...current,
      [key]: value,
      subtotal: nextTotals.subtotal,
      total_amount: nextTotals.totalAmount,
      balance_due: nextTotals.balanceDue,
    }));
  }

  async function saveDocument(sendAfterSave = false) {
    setSaving(true);
    setMessage("");
    try {
      const endpoint =
        mode === "create" ? "/api/admin/documents" : `/api/admin/documents/${document.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...document,
          subtotal: totals.subtotal,
          total_amount: totals.totalAmount,
          balance_due: totals.balanceDue,
          send_after_save: sendAfterSave,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Failed to save document.");
        return;
      }
      setMessage(sendAfterSave ? "Document marked ready to send." : "Draft saved.");
      const saved = data.document as EditableDocument;
      if (mode === "create" && saved?.id) {
        router.push(`/admin/documents/${saved.id}`);
        router.refresh();
        return;
      }
      setDocument((current) => ({
        ...current,
        ...saved,
        line_items: data.lineItems ?? current.line_items,
        payments: data.payments ?? current.payments,
      }));
      router.refresh();
    } catch {
      setMessage("Failed to save document.");
    } finally {
      setSaving(false);
    }
  }

  async function convertDocument() {
    if (!document.id) {
      setMessage("Save the document first before converting it.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const targetType: ClientDocumentType =
        document.document_type === "quote" ? "invoice" : "receipt";
      const response = await fetch(`/api/admin/documents/${document.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Failed to convert document.");
        return;
      }
      router.push(`/admin/documents/${data.document.id}`);
      router.refresh();
    } catch {
      setMessage("Failed to convert document.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-document-builder">
      <DocumentActionBar
        onSaveDraft={() => saveDocument(false)}
        onPublish={document.document_type !== "receipt" ? () => saveDocument(true) : undefined}
        onConvert={document.document_type !== "receipt" ? convertDocument : undefined}
        onRecordPayment={
          document.document_type === "invoice"
            ? () => setShowPaymentForm((current) => !current)
            : undefined
        }
        saveLabel={
          document.document_type === "quote"
            ? "Save Quote Draft"
            : document.document_type === "invoice"
              ? "Save Invoice Draft"
              : "Save Receipt Draft"
        }
        publishLabel={
          document.document_type === "quote"
            ? "Mark Quote Ready to Share"
            : "Mark Invoice Ready to Share"
        }
        convertLabel={
          document.document_type === "quote"
            ? "Convert Quote to Invoice"
            : document.document_type === "invoice"
              ? "Generate Receipt"
              : undefined
        }
        paymentLabel={document.document_type === "invoice" ? "Record Payment" : undefined}
        message={message}
        busy={saving}
      />

      <div className="admin-document-grid-layout">
        <div className="admin-document-main">
          <DocumentHeaderFields
            documentType={document.document_type}
            documentNumber={document.document_number}
            status={document.status}
            issueDate={document.issue_date}
            dueDate={document.due_date}
            expirationDate={document.expiration_date}
            onChange={(key, value) => updateDocument(key as any, value as any)}
          />

          <ClientEventDetailsCard
            values={{
              customer_name: document.customer_name,
              customer_email: document.customer_email,
              customer_phone: document.customer_phone,
              event_type: document.event_type,
              event_date: document.event_date,
              guest_count: document.guest_count ?? null,
              venue_name: document.venue_name,
              venue_address: document.venue_address,
            }}
            onChange={(key, value) => updateDocument(key as any, value as any)}
          />

          <DocumentLineItemsTable items={document.line_items} onChange={updateLineItems} />

          <DocumentNotesSection
            documentType={document.document_type}
            values={{
              notes: document.notes,
              inclusions: document.inclusions,
              exclusions: document.exclusions,
              payment_instructions: document.payment_instructions,
              payment_terms: document.payment_terms,
            }}
            onChange={(key, value) => updateDocument(key as any, value as any)}
          />

          {document.document_type === "invoice" && document.id && showPaymentForm ? (
            <PaymentRecordForm
              documentId={document.id}
              initialPaymentMethod={initialPaymentMethod}
              onRecorded={() => router.refresh()}
            />
          ) : null}

          <section className="card admin-document-section admin-document-section--output">
            <div className="admin-document-section-head">
              <div>
                <p className="eyebrow">Document output</p>
                <h3>{documentTypeLabels[document.document_type]} PDF-ready view</h3>
                <p className="muted">
                  Client-facing documents now open in a standalone output surface for printing or saving as PDF instead of living inside the editor page.
                </p>
              </div>
            </div>
            {document.id ? (
              <div className="admin-document-output-links">
                <Link
                  href={buildDocumentPdfHref(document.id)}
                  className="btn secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open PDF
                </Link>
                <Link
                  href={buildDocumentOutputHref(document.id, {
                    autoprint: true,
                    intent: "print",
                    compact: true,
                  })}
                  className="btn secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Print
                </Link>
                <Link
                  href={buildDocumentPdfHref(document.id, {
                    download: true,
                    compact: true,
                  })}
                  className="btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download PDF
                </Link>
              </div>
            ) : (
              <p className="muted">
                Save the document first to open the standalone print and PDF output.
              </p>
            )}
          </section>

          <div className="admin-document-footer-actions">
            <AdminWorkflowAction
              tone="internal"
              label={saving ? "Saving..." : document.document_type === "quote"
                ? "Save Quote Draft"
                : document.document_type === "invoice"
                  ? "Save Invoice Draft"
                  : "Save Receipt Draft"}
              description="Save the current document details, totals, and preview without changing the external workflow."
              onClick={() => saveDocument(false)}
              disabled={saving}
            />
            {document.document_type !== "receipt" ? (
              <AdminWorkflowAction
                tone="internal"
                label={document.document_type === "quote" ? "Mark Quote Ready to Share" : "Mark Invoice Ready to Share"}
                description="Set the document as ready inside the workflow so the related inquiry or contract flow can share it."
                onClick={() => saveDocument(true)}
                disabled={saving}
              />
            ) : null}
            {document.document_type !== "receipt" ? (
              <AdminWorkflowAction
                tone="record"
                label={document.document_type === "quote" ? "Convert Quote to Invoice" : "Generate Receipt"}
                description="Create the next downstream document record from this document."
                onClick={convertDocument}
                disabled={saving}
              />
            ) : null}
            {document.document_type === "invoice" ? (
              <AdminWorkflowAction
                tone="record"
                label={showPaymentForm ? "Hide Payment Entry" : "Record Payment"}
                description="Open payment entry so balances update and a receipt can be generated."
                onClick={() => setShowPaymentForm((current) => !current)}
                disabled={saving}
              />
            ) : null}
          </div>
        </div>

        <div className="admin-document-sidebar">
          <PricingSummaryCard
            lineItems={document.line_items}
            deliveryFee={document.delivery_fee}
            setupFee={document.setup_fee}
            discountAmount={document.discount_amount}
            taxAmount={document.tax_amount}
            amountPaid={document.amount_paid}
            depositRequired={document.deposit_required}
            onChange={updateMoneyField}
          />

          <div className="card admin-document-summary">
            <p className="eyebrow">Live document total</p>
            <strong className="admin-document-grand-total">
              ${formatMoney(totals.totalAmount)}
            </strong>
            <span>Balance due ${formatMoney(totals.balanceDue)}</span>
          </div>

          <div className="card admin-document-summary">
            <p className="eyebrow">Workflow note</p>
            <span>
              {document.document_type === "quote"
                ? "Quote sharing is handled from the inquiry workflow so client approvals and revisions stay connected."
                : document.document_type === "invoice"
                  ? "Invoice sharing is handled through the contract/payment workflow so receipts and balances stay aligned."
                  : "Receipts are generated from payment records and kept as finance proof of payment."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
