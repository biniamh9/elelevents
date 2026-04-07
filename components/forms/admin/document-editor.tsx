"use client";

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
import DocumentActionBar from "@/components/forms/admin/document-action-bar";
import DocumentHeaderFields from "@/components/forms/admin/document-header-fields";
import ClientEventDetailsCard from "@/components/forms/admin/client-event-details-card";
import DocumentLineItemsTable from "@/components/forms/admin/document-line-items-table";
import PricingSummaryCard from "@/components/forms/admin/pricing-summary-card";
import DocumentNotesSection from "@/components/forms/admin/document-notes-section";
import QuotePreview from "@/components/forms/admin/quote-preview";
import InvoicePreview from "@/components/forms/admin/invoice-preview";
import ReceiptPreview from "@/components/forms/admin/receipt-preview";
import PaymentRecordForm from "@/components/forms/admin/payment-record-form";

type EditableDocument = ClientDocumentWithRelations;

function previewForDocument(document: EditableDocument) {
  if (document.document_type === "invoice") {
    return <InvoicePreview document={document} />;
  }

  if (document.document_type === "receipt") {
    return <ReceiptPreview document={document} />;
  }

  return <QuotePreview document={document} />;
}

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
}: {
  initialDocument: EditableDocument;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [document, setDocument] = useState<EditableDocument>({
    ...initialDocument,
    line_items: normalizeLineItems(initialDocument.line_items),
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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
        onSend={document.document_type !== "receipt" ? () => saveDocument(true) : undefined}
        onConvert={document.document_type !== "receipt" ? convertDocument : undefined}
        onRecordPayment={
          document.document_type === "invoice"
            ? () => setShowPaymentForm((current) => !current)
            : undefined
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
              onRecorded={() => router.refresh()}
            />
          ) : null}

          <section className="card admin-document-section">
            <div className="admin-document-section-head">
              <div>
                <p className="eyebrow">Preview</p>
                <h3>{documentTypeLabels[document.document_type]}</h3>
                <p className="muted">
                  Review the client-facing version before sending or converting this document.
                </p>
              </div>
            </div>
            {previewForDocument({
              ...document,
              subtotal: totals.subtotal,
              total_amount: totals.totalAmount,
              balance_due: totals.balanceDue,
            })}
          </section>
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
        </div>
      </div>
    </div>
  );
}
