"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { buildInquiryItemizedDraftHref } from "@/lib/admin-navigation";
import {
  calculateLineTotal,
  calculateQuoteTotals,
  DEFAULT_ITEMIZED_DISCLAIMER,
  DEFAULT_BASE_FEE,
  formatCatalogLabel,
  type InquiryQuoteLineItem,
  type InquiryQuotePricing,
  type PricingCatalogItem,
} from "@/lib/admin-pricing";

function QuoteActionMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="admin-row-action-menu admin-quote-action-menu">
      <summary className="admin-row-action-trigger admin-quote-action-trigger">
        <span>{label}</span>
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
      <div className="admin-row-action-dropdown admin-quote-action-dropdown">
        {children}
      </div>
    </details>
  );
}

type EditableLineItem = {
  id: string;
  pricing_catalog_item_id: string | null;
  item_name: string;
  category: string | null;
  variant: string | null;
  unit_label: string | null;
  unit_price: number;
  quantity: number;
  notes: string | null;
  sort_order: number | null;
  is_custom: boolean;
};

function toEditableLineItem(
  item: Partial<InquiryQuoteLineItem>,
  index: number
): EditableLineItem {
  return {
    id: item.id ?? `local-${index}-${Math.random().toString(36).slice(2, 8)}`,
    pricing_catalog_item_id: item.pricing_catalog_item_id ?? null,
    item_name: item.item_name ?? "",
    category: item.category ?? null,
    variant: item.variant ?? null,
    unit_label: item.unit_label ?? "each",
    unit_price: Number(item.unit_price ?? 0),
    quantity: Number(item.quantity ?? 1),
    notes: item.notes ?? null,
    sort_order: item.sort_order ?? index,
    is_custom: Boolean(item.is_custom),
  };
}

export default function QuoteManagementForm({
  inquiryId,
  currentAmount,
  clientEmail,
  clientName,
  eventType,
  eventDate,
  catalogItems,
  initialPricing,
  initialLineItems,
}: {
  inquiryId: string;
  currentAmount: number | null;
  clientEmail: string | null;
  clientName: string;
  eventType: string | null;
  eventDate: string | null;
  catalogItems: PricingCatalogItem[];
  initialPricing: InquiryQuotePricing | null;
  initialLineItems: InquiryQuoteLineItem[];
}) {
  const router = useRouter();
  const initialBaseFee =
    initialPricing?.base_fee ??
    (currentAmount !== null && currentAmount > 0 ? currentAmount : DEFAULT_BASE_FEE);
  const [baseFee, setBaseFee] = useState(
    String(initialBaseFee)
  );
  const [discountAmount, setDiscountAmount] = useState(
    String(initialPricing?.discount_amount ?? 0)
  );
  const [deliveryFee, setDeliveryFee] = useState(
    String(initialPricing?.delivery_fee ?? 0)
  );
  const [laborAdjustment, setLaborAdjustment] = useState(
    String(initialPricing?.labor_adjustment ?? 0)
  );
  const [taxAmount, setTaxAmount] = useState(
    String(initialPricing?.tax_amount ?? 0)
  );
  const [manualTotalOverride, setManualTotalOverride] = useState(
    initialPricing?.manual_total_override !== null &&
      initialPricing?.manual_total_override !== undefined
      ? String(initialPricing.manual_total_override)
      : ""
  );
  const [pricingNotes, setPricingNotes] = useState(initialPricing?.notes ?? "");
  const [draftStatus, setDraftStatus] = useState<
    "internal_draft" | "ready_to_send" | "shared_with_customer"
  >(initialPricing?.draft_status ?? "internal_draft");
  const [clientDisclaimer, setClientDisclaimer] = useState(
    initialPricing?.client_disclaimer ?? DEFAULT_ITEMIZED_DISCLAIMER
  );
  const [quoteMessage, setQuoteMessage] = useState(
    "Thank you for meeting with us. Based on the event scope we discussed, here is your quote. If you would like to move forward, reply to this email and we will prepare your contract."
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState(
    catalogItems[0]?.id ?? ""
  );
  const [customName, setCustomName] = useState("");
  const [customVariant, setCustomVariant] = useState("");
  const [customUnitLabel, setCustomUnitLabel] = useState("each");
  const [customUnitPrice, setCustomUnitPrice] = useState("");
  const [customQuantity, setCustomQuantity] = useState("1");
  const [customNotes, setCustomNotes] = useState("");
  const [lineItems, setLineItems] = useState<EditableLineItem[]>(
    initialLineItems.map(toEditableLineItem)
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copying, setCopying] = useState(false);

  const totals = useMemo(
    () =>
      calculateQuoteTotals(
        {
          base_fee: Number(baseFee || DEFAULT_BASE_FEE),
          discount_amount: Number(discountAmount || 0),
          delivery_fee: Number(deliveryFee || 0),
          labor_adjustment: Number(laborAdjustment || 0),
          tax_amount: Number(taxAmount || 0),
          manual_total_override: manualTotalOverride
            ? Number(manualTotalOverride)
            : null,
        },
        lineItems
      ),
    [baseFee, deliveryFee, discountAmount, laborAdjustment, lineItems, manualTotalOverride, taxAmount]
  );

  const currentDisplayAmount = currentAmount ?? totals.grandTotal;

  function updateLineItem(
    id: string,
    updates: Partial<EditableLineItem>
  ) {
    setLineItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item
      )
    );
  }

  function addCatalogItem() {
    const selected = catalogItems.find((item) => item.id === selectedCatalogId);
    if (!selected) {
      return;
    }

    setLineItems((current) => [
      ...current,
      {
        id: `local-${current.length + 1}-${Date.now()}`,
        pricing_catalog_item_id: selected.id,
        item_name: selected.name,
        category: selected.category ?? null,
        variant: selected.variant ?? null,
        unit_label: selected.unit_label ?? "each",
        unit_price: Number(selected.unit_price ?? 0),
        quantity: 1,
        notes: selected.notes ?? null,
        sort_order: current.length,
        is_custom: false,
      },
    ]);
  }

  function addCustomItem() {
    if (!customName.trim()) {
      setMessage("Custom item name is required.");
      return;
    }

    setLineItems((current) => [
      ...current,
      {
        id: `custom-${current.length + 1}-${Date.now()}`,
        pricing_catalog_item_id: null,
        item_name: customName.trim(),
        category: "Custom",
        variant: customVariant.trim() || null,
        unit_label: customUnitLabel.trim() || "each",
        unit_price: Number(customUnitPrice || 0),
        quantity: Number(customQuantity || 1),
        notes: customNotes.trim() || null,
        sort_order: current.length,
        is_custom: true,
      },
    ]);

    setCustomName("");
    setCustomVariant("");
    setCustomUnitLabel("each");
    setCustomUnitPrice("");
    setCustomQuantity("1");
    setCustomNotes("");
    setMessage("");
  }

  function removeLineItem(id: string) {
    setLineItems((current) => current.filter((item) => item.id !== id));
  }

  async function saveQuoteBuilder(
    markAsQuoted = false,
    options?: {
      generateDraft?: boolean;
      draftStatus?: "internal_draft" | "ready_to_send" | "shared_with_customer";
    }
  ) {
    setSaving(true);
    setMessage("");

    const nextDraftStatus = options?.draftStatus ?? draftStatus;

    const res = await fetch(`/api/admin/inquiries/${inquiryId}/quote-pricing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_fee: Number(baseFee || DEFAULT_BASE_FEE),
        discount_amount: Number(discountAmount || 0),
        delivery_fee: Number(deliveryFee || 0),
        labor_adjustment: Number(laborAdjustment || 0),
        tax_amount: Number(taxAmount || 0),
        manual_total_override: manualTotalOverride ? Number(manualTotalOverride) : null,
        notes: pricingNotes || null,
        draft_status: nextDraftStatus,
        client_disclaimer: clientDisclaimer || DEFAULT_ITEMIZED_DISCLAIMER,
        generate_draft: options?.generateDraft === true,
        mark_as_quoted: markAsQuoted,
        line_items: lineItems.map((item, index) => ({
          ...item,
          sort_order: index,
        })),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save itemized quote.");
      return;
    }

    setDraftStatus(nextDraftStatus);
    setMessage(markAsQuoted ? "Quote pricing saved and inquiry marked quoted." : "Quote pricing saved.");
    router.refresh();
  }

  async function sendQuote() {
    setSending(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}/send-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteAmount: totals.grandTotal,
        quoteMessage,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to send quote email.");
      return;
    }

    setMessage("Quote email sent.");
    router.refresh();
  }

  async function copyDraftSummary() {
    setCopying(true);
    setMessage("");
    try {
      const lines = [
        `Itemized estimate for ${clientName}`,
        `${eventType || "Event"}${eventDate ? ` • ${eventDate}` : ""}`,
        "",
        `Base event fee: $${totals.baseFee.toLocaleString()}`,
        ...lineItems.map(
          (item) =>
            `${item.item_name}${item.variant ? ` (${item.variant})` : ""} — ${item.quantity} × $${Number(item.unit_price).toLocaleString()} = $${calculateLineTotal(item.unit_price, item.quantity).toLocaleString()}`
        ),
        "",
        `Final total: $${totals.grandTotal.toLocaleString()}`,
        "",
        clientDisclaimer || DEFAULT_ITEMIZED_DISCLAIMER,
      ];

      await navigator.clipboard.writeText(lines.join("\n"));
      setMessage("Itemized draft copied.");
    } catch {
      setMessage("Failed to copy itemized draft.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="admin-quote-builder">
      <div className="admin-quote-builder-intro">
        <div>
          <h4 style={{ marginBottom: "10px" }}>Itemized Quote Builder</h4>
          <p className="muted">
            Start with the base flat fee, add catalog items or custom pieces,
            then save the total back into the inquiry before sending the quote.
          </p>
        </div>
        <div className="admin-quote-total-card">
          <span>Current quote total</span>
          <strong>${currentDisplayAmount.toLocaleString()}</strong>
        </div>
      </div>

      <div className="admin-quote-grid">
        <div className="card admin-quote-main">
          <div className="admin-quote-section">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Base Pricing</p>
                <h3>Start every event with the flat fee</h3>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Base Flat Fee</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Discount</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Delivery Fee</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Labor Adjustment</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={laborAdjustment}
                  onChange={(e) => setLaborAdjustment(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Tax</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Manual Total Override</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualTotalOverride}
                  onChange={(e) => setManualTotalOverride(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="admin-quote-section">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Catalog Items</p>
                <h3>Add reusable decor pricing</h3>
              </div>
            </div>
            <div className="admin-quote-add-row">
              <select
                className="input"
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatCatalogLabel(item)} • ${Number(item.unit_price).toLocaleString()} / {item.unit_label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn secondary" onClick={addCatalogItem}>
                Add Catalog Item
              </button>
            </div>
          </div>

          <div className="admin-quote-section">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Custom Line Item</p>
                <h3>Add a manual pricing line</h3>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Item Name</label>
                <input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Variant</label>
                <input className="input" value={customVariant} onChange={(e) => setCustomVariant(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Unit Label</label>
                <input className="input" value={customUnitLabel} onChange={(e) => setCustomUnitLabel(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Unit Price</label>
                <input className="input" type="number" min="0" step="0.01" value={customUnitPrice} onChange={(e) => setCustomUnitPrice(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Quantity</label>
                <input className="input" type="number" min="0" step="1" value={customQuantity} onChange={(e) => setCustomQuantity(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Notes</label>
                <input className="input" value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} />
              </div>
            </div>

            <button type="button" className="btn secondary" onClick={addCustomItem}>
              Add Custom Item
            </button>
          </div>

          <div className="admin-quote-section">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Line Items</p>
                <h3>Build the quote total</h3>
              </div>
            </div>

            <div className="admin-quote-table-wrap">
              <table className="admin-quote-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Variant</th>
                    <th>Unit price</th>
                    <th>Qty</th>
                    <th>Notes</th>
                    <th>Line total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length ? (
                    lineItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            className="input"
                            value={item.item_name}
                            onChange={(e) =>
                              updateLineItem(item.id, { item_name: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={item.variant ?? ""}
                            onChange={(e) =>
                              updateLineItem(item.id, { variant: e.target.value || null })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateLineItem(item.id, { unit_price: Number(e.target.value || 0) })
                            }
                          />
                          <small>{item.unit_label || "each"}</small>
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, { quantity: Number(e.target.value || 0) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={item.notes ?? ""}
                            onChange={(e) =>
                              updateLineItem(item.id, { notes: e.target.value || null })
                            }
                            placeholder="Optional"
                          />
                        </td>
                        <td className="admin-quote-table-total">
                          ${calculateLineTotal(item.unit_price, item.quantity).toLocaleString()}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => removeLineItem(item.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="admin-quote-empty">
                        No line items yet. Add a catalog item or create a custom line.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="field">
            <label className="label">Internal Quote Notes</label>
            <textarea
              className="textarea"
              value={pricingNotes}
              onChange={(e) => setPricingNotes(e.target.value)}
              placeholder="Optional delivery notes, labor assumptions, install timing, or discount context."
            />
          </div>

          <div className="field">
            <label className="label">Customer Disclaimer</label>
            <textarea
              className="textarea"
              value={clientDisclaimer}
              onChange={(e) => setClientDisclaimer(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Quote Email Message</label>
            <textarea
              className="textarea"
              value={quoteMessage}
              onChange={(e) => setQuoteMessage(e.target.value)}
              placeholder="Write the message that goes with the quote."
            />
          </div>

          <p className="muted">
            Sending to: {clientName} {clientEmail ? `(${clientEmail})` : ""}
          </p>

          <div className="admin-quote-footer-actions">
            <AdminWorkflowAction
              tone="internal"
              label={saving ? "Saving..." : "Save Quote Builder"}
              description="Save the quote draft and itemized pricing before moving forward."
              onClick={() => saveQuoteBuilder(false)}
              disabled={saving}
            />
            <AdminWorkflowAction
              tone="internal"
              label={saving ? "Saving..." : "Save Quote + Set Quoted Status"}
              description="Save the quote and update the inquiry status to quoted without emailing the client."
              onClick={() => saveQuoteBuilder(true)}
              disabled={saving}
            />
            <AdminWorkflowAction
              tone="email"
              label={sending ? "Sending..." : "Email Quote to Client"}
              description="Send the quote email with the current pricing, approval link, and revision flow."
              onClick={sendQuote}
              disabled={sending}
            />
          </div>
        </div>

        <aside className="card admin-quote-sidebar">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Quote Summary</p>
              <h3>Rolled-up total</h3>
            </div>
          </div>

          <div className="admin-quote-summary-list">
            <div>
              <span>Base fee</span>
              <strong>${totals.baseFee.toLocaleString()}</strong>
            </div>
            <div>
              <span>Line items</span>
              <strong>${totals.lineItemsTotal.toLocaleString()}</strong>
            </div>
            <div>
              <span>Delivery fee</span>
              <strong>${totals.deliveryFee.toLocaleString()}</strong>
            </div>
            <div>
              <span>Labor adjustment</span>
              <strong>${totals.laborAdjustment.toLocaleString()}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>-${totals.discountAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>${totals.taxAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>${totals.subtotal.toLocaleString()}</strong>
            </div>
            {totals.manualTotalOverride !== null ? (
              <div>
                <span>Manual override</span>
                <strong>${totals.manualTotalOverride.toLocaleString()}</strong>
              </div>
            ) : null}
          </div>

          <div className="admin-quote-grand-total">
            <span>Grand total</span>
            <strong>${totals.grandTotal.toLocaleString()}</strong>
          </div>

          <div className="admin-quote-controls">
            <div className="admin-quote-controls-head">
              <div>
                <p className="eyebrow">Quote actions</p>
                <h4>Save, draft, and share</h4>
              </div>
              <span className="admin-status-pill">
                {draftStatus === "internal_draft"
                  ? "Internal draft"
                  : draftStatus === "ready_to_send"
                    ? "Ready to send"
                    : "Shared with customer"}
              </span>
            </div>

            <div className="admin-quote-action-group">
              <p className="admin-quote-action-label">Quote actions</p>
              <div className="admin-quote-primary-actions">
                <AdminWorkflowAction
                  tone="internal"
                  label={saving ? "Saving..." : "Save Quote Builder"}
                  description="Stores pricing, line items, and draft content without changing the client-facing stage."
                  onClick={() => saveQuoteBuilder(false)}
                  disabled={saving}
                />
                <AdminWorkflowAction
                  tone="internal"
                  label={saving ? "Saving..." : "Save Quote + Set Quoted Status"}
                  description="Saves the quote and updates the inquiry to quoted. It does not email the client."
                  onClick={() => saveQuoteBuilder(true)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-quote-action-group">
              <p className="admin-quote-action-label">Draft / preview</p>
              <div className="admin-quote-menu-row">
                <QuoteActionMenu label="Draft Actions">
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="internal"
                    label={saving ? "Saving..." : "Save Itemized Draft"}
                    description="Stores an internal itemized draft for review. Nothing is sent to the client."
                    onClick={() => saveQuoteBuilder(false, { generateDraft: true })}
                    disabled={saving}
                  />
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="internal"
                    label="Open Itemized Draft Preview"
                    description="Opens the saved itemized draft preview in the admin workspace."
                    onClick={() => router.push(buildInquiryItemizedDraftHref(inquiryId))}
                  />
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="internal"
                    label={copying ? "Copying..." : "Copy Draft Content"}
                    description="Copies the draft text for manual reuse outside the system."
                    onClick={copyDraftSummary}
                    disabled={copying}
                  />
                </QuoteActionMenu>
                <p className="admin-quote-inline-note">
                  Use these when a client asks for a detailed planning draft.
                </p>
              </div>
            </div>

            <div className="admin-quote-action-group">
              <p className="admin-quote-action-label">Customer sharing</p>
              <div className="admin-quote-menu-row">
                <QuoteActionMenu label="Share Actions">
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="internal"
                    label={saving ? "Saving..." : "Set Ready to Send"}
                    description="Marks the quote as internally ready for client delivery. No email is sent."
                    onClick={() =>
                      saveQuoteBuilder(false, { draftStatus: "ready_to_send" })
                    }
                    disabled={saving}
                  />
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="internal"
                    label={saving ? "Saving..." : "Set Shared Status"}
                    description="Updates the internal quote state to shared. It does not send or resend email."
                    onClick={() =>
                      saveQuoteBuilder(false, {
                        draftStatus: "shared_with_customer",
                      })
                    }
                    disabled={saving}
                  />
                  <AdminWorkflowAction
                    className="admin-workflow-action--menu"
                    tone="email"
                    label={sending ? "Sending..." : "Email Quote to Client"}
                    description="Sends the quote email with approval and change-request links."
                    onClick={sendQuote}
                    disabled={sending}
                  />
                </QuoteActionMenu>
                <p className="admin-quote-inline-note">
                  These actions update the quote status or deliver the quote email; client approval still happens separately.
                </p>
              </div>
            </div>
          </div>

          {message ? <p className={message.includes("saved") || message.includes("sent") ? "success" : "error"}>{message}</p> : null}
        </aside>
      </div>
    </div>
  );
}
