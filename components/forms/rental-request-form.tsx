"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  clearRentalInquiryItems,
  readRentalInquiryItems,
  RENTAL_INQUIRY_UPDATED_EVENT,
} from "@/lib/rental-inquiry";
import {
  calculateRentalQuoteTotals,
  formatMoney,
  formatRentalPrice,
  type RentalItem,
} from "@/lib/rental-shared";

type RentalRequestFormProps = {
  items: RentalItem[];
  selectedSlug?: string | null;
  source?: "single" | "shortlist" | null;
};

type RentalLineState = {
  slug: string;
  quantity: number;
};

type RentalRequestState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  venueName: string;
  occasionLabel: string;
  guestCount: string;
  notes: string;
  includeDelivery: boolean;
  includeSetup: boolean;
  includeBreakdown: boolean;
};

const initialFormState: RentalRequestState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  eventDate: "",
  venueName: "",
  occasionLabel: "",
  guestCount: "",
  notes: "",
  includeDelivery: false,
  includeSetup: false,
  includeBreakdown: false,
};

function buildInitialLines(
  items: RentalItem[],
  selectedSlug?: string | null,
  source?: "single" | "shortlist" | null
) {
  if (source === "shortlist") {
    const shortlist = readRentalInquiryItems();
    return shortlist
      .map((entry) => items.find((item) => item.slug === entry.slug))
      .filter(Boolean)
      .map((item) => ({
        slug: (item as RentalItem).slug,
        quantity: Math.max((item as RentalItem).minimum_order_quantity, 1),
      }));
  }

  if (selectedSlug) {
    const match = items.find((item) => item.slug === selectedSlug);
    if (match) {
      return [
        {
          slug: match.slug,
          quantity: Math.max(match.minimum_order_quantity, 1),
        },
      ];
    }
  }

  return [] as RentalLineState[];
}

function normalizeQuantity(value: number, minimum: number) {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(Math.trunc(value), minimum, 1);
}

export default function RentalRequestForm({
  items,
  selectedSlug,
  source,
}: RentalRequestFormProps) {
  const [form, setForm] = useState<RentalRequestState>(initialFormState);
  const [lines, setLines] = useState<RentalLineState[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLines(buildInitialLines(items, selectedSlug, source));
  }, [items, selectedSlug, source]);

  useEffect(() => {
    if (source !== "shortlist") {
      return;
    }

    const sync = () => setLines(buildInitialLines(items, selectedSlug, source));
    window.addEventListener(RENTAL_INQUIRY_UPDATED_EVENT, sync);

    return () => window.removeEventListener(RENTAL_INQUIRY_UPDATED_EVENT, sync);
  }, [items, selectedSlug, source]);

  const selectedItems = useMemo(
    () =>
      lines
        .map((line) => {
          const item = items.find((entry) => entry.slug === line.slug);
          if (!item) {
            return null;
          }

          return {
            item,
            quantity: normalizeQuantity(line.quantity, item.minimum_order_quantity),
          };
        })
        .filter(Boolean) as Array<{ item: RentalItem; quantity: number }>,
    [items, lines]
  );

  const quoteTotals = useMemo(() => {
    const subtotals = selectedItems.map(({ item, quantity }) =>
      calculateRentalQuoteTotals({
        quantity,
        baseRentalPrice: item.base_rental_price,
        priceType: item.price_type,
        includeDelivery: form.includeDelivery && item.delivery_available,
        includeSetup: form.includeSetup && item.setup_available,
        includeBreakdown: form.includeBreakdown && item.breakdown_available,
        deliveryFee: item.default_delivery_fee,
        setupFee: item.default_setup_fee,
        breakdownFee: item.default_breakdown_fee,
        depositRequired: item.deposit_required,
        depositType: item.deposit_type,
        depositAmount: item.deposit_amount,
      })
    );

    return subtotals.reduce(
      (acc, totals) => ({
        subtotal: acc.subtotal + totals.subtotal,
        deliveryFee: acc.deliveryFee + totals.deliveryFee,
        setupFee: acc.setupFee + totals.setupFee,
        breakdownFee: acc.breakdownFee + totals.breakdownFee,
        securityDeposit: acc.securityDeposit + totals.securityDeposit,
        serviceTotal: acc.serviceTotal + totals.serviceTotal,
        total: acc.total + totals.total,
      }),
      {
        subtotal: 0,
        deliveryFee: 0,
        setupFee: 0,
        breakdownFee: 0,
        securityDeposit: 0,
        serviceTotal: 0,
        total: 0,
      }
    );
  }, [form.includeBreakdown, form.includeDelivery, form.includeSetup, selectedItems]);

  const canRequestDelivery = selectedItems.some(({ item }) => item.delivery_available);
  const canRequestSetup = selectedItems.some(({ item }) => item.setup_available);
  const canRequestBreakdown = selectedItems.some(({ item }) => item.breakdown_available);

  function updateLine(slug: string, quantity: number) {
    setLines((current) =>
      current.map((line) => (line.slug === slug ? { ...line, quantity } : line))
    );
  }

  function addAnotherLine() {
    const fallbackItem =
      items.find((item) => !lines.some((line) => line.slug === item.slug)) ?? items[0];

    if (!fallbackItem) {
      return;
    }

    setLines((current) => [
      ...current,
      {
        slug: fallbackItem.slug,
        quantity: Math.max(fallbackItem.minimum_order_quantity, 1),
      },
    ]);
  }

  function changeLineItem(currentSlug: string, nextSlug: string) {
    const nextItem = items.find((item) => item.slug === nextSlug);
    if (!nextItem) {
      return;
    }

    setLines((current) =>
      current.map((line) =>
        line.slug === currentSlug
          ? {
              slug: nextSlug,
              quantity: Math.max(nextItem.minimum_order_quantity, 1),
            }
          : line
      )
    );
  }

  function removeLine(slug: string) {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedItems.length) {
      setError("Select at least one rental item before requesting a quote.");
      return;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError("Add your contact details before requesting a rental quote.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const selectedSummary = selectedItems
      .map(({ item, quantity }) => {
        const parts = [`${item.name} x ${quantity}`];
        if (item.deposit_required) {
          parts.push(`deposit ${formatMoney(
            calculateRentalQuoteTotals({
              quantity,
              baseRentalPrice: item.base_rental_price,
              priceType: item.price_type,
              depositRequired: item.deposit_required,
              depositType: item.deposit_type,
              depositAmount: item.deposit_amount,
            }).securityDeposit
          )}`);
        }
        return parts.join(" • ");
      })
      .join("\n");

    const notes = [
      "Rental quote request",
      form.occasionLabel ? `Occasion: ${form.occasionLabel}` : null,
      form.eventDate ? `Requested date: ${form.eventDate}` : null,
      form.venueName ? `Venue / delivery location: ${form.venueName}` : null,
      form.guestCount ? `Guest count: ${form.guestCount}` : null,
      "",
      "Requested rental items:",
      selectedSummary,
      "",
      "Requested services:",
      `Delivery: ${form.includeDelivery ? "Yes" : "No"}`,
      `Setup: ${form.includeSetup ? "Yes" : "No"}`,
      `Breakdown: ${form.includeBreakdown ? "Yes" : "No"}`,
      "",
      "Preliminary pricing:",
      `Rental subtotal: ${formatMoney(quoteTotals.subtotal)}`,
      `Delivery fee: ${formatMoney(quoteTotals.deliveryFee)}`,
      `Setup fee: ${formatMoney(quoteTotals.setupFee)}`,
      `Breakdown fee: ${formatMoney(quoteTotals.breakdownFee)}`,
      `Refundable security deposit: ${formatMoney(quoteTotals.securityDeposit)}`,
      `Estimated total incl. deposit: ${formatMoney(quoteTotals.total)}`,
      form.notes ? `\nClient notes:\n${form.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const inquiryPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      eventType: "Rental inquiry",
      eventDate: form.eventDate || null,
      guestCount: form.guestCount ? Number(form.guestCount) || null : null,
      venueName: form.venueName.trim() || null,
      venueStatus: null,
      services: [
        "Rental inquiry",
        form.includeDelivery ? "Rental delivery" : null,
        form.includeSetup ? "Rental setup" : null,
        form.includeBreakdown ? "Rental breakdown" : null,
      ].filter(Boolean),
      indoorOutdoor: null,
      colorsTheme: null,
      inspirationNotes: null,
      visionBoardUrls: [],
      selectedDecorCategories: [],
      decorSelections: [],
      additionalInfo: notes,
      requestedVendorCategories: [],
      vendorRequestNotes: null,
      preferredContactMethod: "Email",
      consultationPreferenceDate: null,
      consultationPreferenceTime: null,
      consultationVideoPlatform: null,
      referralSource: "website_rental_inquiry",
      needsDeliverySetup: form.includeDelivery || form.includeSetup || form.includeBreakdown,
      estimatedPrice: quoteTotals.serviceTotal,
    };

    try {
      const inquiryRes = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryPayload),
      });

      const inquiryData = await inquiryRes.json();

      if (!inquiryRes.ok) {
        setError(inquiryData.error || "Unable to submit the rental quote request.");
        setLoading(false);
        return;
      }

      try {
        await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            eventDate: form.eventDate,
            guestCount: form.guestCount || "",
            notes,
          }),
        });
      } catch (sendError) {
        console.error("Rental request email failed:", sendError);
      }

      if (source === "shortlist") {
        clearRentalInquiryItems();
      }

      setSuccess("Your rental quote request has been received.");
      setForm(initialFormState);
      setLines(buildInitialLines(items, selectedSlug, null));
    } catch (submitError) {
      console.error("Rental request failed:", submitError);
      setError("Unable to submit the rental quote request right now.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="rental-request-success">
        <p className="eyebrow">Rental quote received</p>
        <h2>Your rental request is in review.</h2>
        <p className="muted">
          We will confirm item availability, logistics, and refundable security deposit details before finalizing the quote.
        </p>
        <div className="btn-row">
          <Button href="/rentals">Back to Rentals</Button>
          <Button variant="secondary" href="/contact">
            Contact Us
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="rental-request-layout">
      <section className="rental-request-main">
        <Card className="rental-request-panel">
          <div className="section-heading section-heading--tight">
            <p className="eyebrow">Rental quote request</p>
            <h2>Request pricing, quantity confirmation, and logistics for your selected rentals.</h2>
          </div>

          <form className="rental-request-form" onSubmit={handleSubmit}>
            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>Selected rental items</h3>
                <p className="muted">Confirm the pieces you need and adjust quantity before sending the request.</p>
              </div>

              <div className="rental-request-lines">
                {lines.map((line, index) => {
                  const selectedItem = items.find((item) => item.slug === line.slug);
                  if (!selectedItem) {
                    return null;
                  }

                  return (
                    <div key={`${line.slug}-${index}`} className="rental-request-line">
                      <label>
                        <span>Rental item</span>
                        <select
                          value={line.slug}
                          onChange={(e) => changeLineItem(line.slug, e.target.value)}
                        >
                          {items.map((item) => (
                            <option key={item.slug} value={item.slug}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Quantity</span>
                        <input
                          type="number"
                          min={selectedItem.minimum_order_quantity}
                          max={Math.max(selectedItem.available_quantity, selectedItem.minimum_order_quantity)}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(
                              line.slug,
                              normalizeQuantity(
                                Number(e.target.value),
                                selectedItem.minimum_order_quantity
                              )
                            )
                          }
                        />
                      </label>

                      <div className="rental-request-line__meta">
                        <strong>{formatRentalPrice(selectedItem.base_rental_price, selectedItem.price_type)}</strong>
                        <span>{selectedItem.available_quantity} available</span>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => removeLine(line.slug)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="btn-row">
                <Button type="button" variant="secondary" onClick={addAnotherLine}>
                  Add Another Item
                </Button>
              </div>
            </section>

            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>Event and logistics</h3>
                <p className="muted">Tell us when and where the rentals are needed so we can quote the right support.</p>
              </div>

              <div className="rental-request-fields rental-request-fields--two">
                <label>
                  <span>Event / pickup date</span>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Occasion</span>
                  <input
                    type="text"
                    placeholder="Wedding, shower, engagement, reception"
                    value={form.occasionLabel}
                    onChange={(e) => setForm((prev) => ({ ...prev, occasionLabel: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Venue or delivery location</span>
                  <input
                    type="text"
                    placeholder="Venue name or delivery address"
                    value={form.venueName}
                    onChange={(e) => setForm((prev) => ({ ...prev, venueName: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Guest count</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={form.guestCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, guestCount: e.target.value }))}
                  />
                </label>
              </div>

              <div className="rental-request-options">
                <label className={`rental-request-toggle ${!canRequestDelivery ? "is-disabled" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.includeDelivery}
                    disabled={!canRequestDelivery}
                    onChange={(e) => setForm((prev) => ({ ...prev, includeDelivery: e.target.checked }))}
                  />
                  <div>
                    <strong>Include delivery</strong>
                    <span>Request delivery pricing where available.</span>
                  </div>
                </label>

                <label className={`rental-request-toggle ${!canRequestSetup ? "is-disabled" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.includeSetup}
                    disabled={!canRequestSetup}
                    onChange={(e) => setForm((prev) => ({ ...prev, includeSetup: e.target.checked }))}
                  />
                  <div>
                    <strong>Include setup</strong>
                    <span>Add setup support for installation-ready items.</span>
                  </div>
                </label>

                <label className={`rental-request-toggle ${!canRequestBreakdown ? "is-disabled" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.includeBreakdown}
                    disabled={!canRequestBreakdown}
                    onChange={(e) => setForm((prev) => ({ ...prev, includeBreakdown: e.target.checked }))}
                  />
                  <div>
                    <strong>Include breakdown</strong>
                    <span>Request pickup and takedown support where available.</span>
                  </div>
                </label>
              </div>
            </section>

            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>Contact details</h3>
                <p className="muted">We use this to confirm availability and send the formal rental quote.</p>
              </div>

              <div className="rental-request-fields rental-request-fields--two">
                <label>
                  <span>First name</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Last name</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                <span>Notes</span>
                <textarea
                  rows={5}
                  placeholder="Share timing, access notes, quantity questions, or anything we should know before quoting."
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </section>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="rental-request-actions">
              <Button type="submit">{loading ? "Submitting..." : "Request Rental Quote"}</Button>
            </div>
          </form>
        </Card>
      </section>

      <aside className="rental-request-sidebar">
        <Card className="rental-request-summary">
          <p className="eyebrow">Quote preview</p>
          <h3>Estimated rental total</h3>

          <div className="rental-request-summary__lines">
            {selectedItems.map(({ item, quantity }) => {
              const totals = calculateRentalQuoteTotals({
                quantity,
                baseRentalPrice: item.base_rental_price,
                priceType: item.price_type,
                includeDelivery: form.includeDelivery && item.delivery_available,
                includeSetup: form.includeSetup && item.setup_available,
                includeBreakdown: form.includeBreakdown && item.breakdown_available,
                deliveryFee: item.default_delivery_fee,
                setupFee: item.default_setup_fee,
                breakdownFee: item.default_breakdown_fee,
                depositRequired: item.deposit_required,
                depositType: item.deposit_type,
                depositAmount: item.deposit_amount,
              });

              return (
                <div key={item.slug} className="rental-request-summary__item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{quantity} × {formatRentalPrice(item.base_rental_price, item.price_type)}</span>
                  </div>
                  <strong>{formatMoney(totals.subtotal)}</strong>
                </div>
              );
            })}
          </div>

          <div className="rental-request-summary__totals">
            <div><span>Rental subtotal</span><strong>{formatMoney(quoteTotals.subtotal)}</strong></div>
            <div><span>Delivery fee</span><strong>{formatMoney(quoteTotals.deliveryFee)}</strong></div>
            <div><span>Setup fee</span><strong>{formatMoney(quoteTotals.setupFee)}</strong></div>
            <div><span>Breakdown fee</span><strong>{formatMoney(quoteTotals.breakdownFee)}</strong></div>
            <div><span>Refundable security deposit</span><strong>{formatMoney(quoteTotals.securityDeposit)}</strong></div>
            <div className="is-total"><span>Estimated total</span><strong>{formatMoney(quoteTotals.total)}</strong></div>
          </div>

          <p className="muted">
            Refundable security deposits stay separate from service charges and are reviewed after return inspection.
          </p>
        </Card>
      </aside>
    </div>
  );
}
