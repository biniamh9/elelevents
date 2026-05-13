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
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  venueName: string;
  eventAddress: string;
  eventZip: string;
  occasionLabel: string;
  guestCount: string;
  notes: string;
  includeDelivery: boolean;
  includeSetup: boolean;
  includeBreakdown: boolean;
};

const initialFormState: RentalRequestState = {
  fullName: "",
  email: "",
  phone: "",
  eventDate: "",
  venueName: "",
  eventAddress: "",
  eventZip: "",
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
  const [currentStep, setCurrentStep] = useState(0);
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
  const rentalSteps = ["Chairs", "Event", "Services", "Contact"];

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

  function validateStep(step = currentStep) {
    if (step === 0 && !selectedItems.length) {
      setError("Choose at least one chair rental item.");
      return false;
    }

    if (step === 1) {
      if (!form.eventAddress.trim()) {
        setError("Add the event address so our team can confirm mileage and delivery access.");
        return false;
      }

      if (!form.eventZip.trim()) {
        setError("Add the event ZIP code so we can review delivery distance from storage ZIP 30083.");
        return false;
      }
    }

    if (step === 3) {
      if (!form.fullName.trim()) {
        setError("Add your full name before requesting a rental quote.");
        return false;
      }

      if (!form.email.trim() && !form.phone.trim()) {
        setError("Add either a phone number or email address so we can send the rental quote.");
        return false;
      }
    }

    setError("");
    return true;
  }

  function goNext() {
    if (!validateStep()) {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, rentalSteps.length - 1));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedItems.length) {
      setError("Select at least one rental item before requesting a quote.");
      return;
    }

    const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/);
    const lastName = lastNameParts.join(" ") || "Rental Request";

    if (!form.fullName.trim()) {
      setError("Add your full name before requesting a rental quote.");
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      setError("Add either a phone number or email address so we can send the rental quote.");
      return;
    }

    if (!form.eventZip.trim()) {
      setError("Add the event ZIP code so we can review delivery distance from storage ZIP 30083.");
      return;
    }

    if (!form.eventAddress.trim()) {
      setError("Add the event address so our team can confirm mileage and delivery access.");
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
      form.venueName ? `Venue: ${form.venueName}` : null,
      form.eventAddress ? `Event address: ${form.eventAddress}` : null,
      form.eventZip ? `Event ZIP: ${form.eventZip}` : null,
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
      form.notes ? `\nClient notes:\n${form.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const inquiryPayload = {
      firstName,
      lastName,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      eventDate: form.eventDate || null,
      guestCount: form.guestCount ? Number(form.guestCount) || null : null,
      venueName: form.venueName.trim() || null,
      eventAddress: form.eventAddress.trim(),
      eventZip: form.eventZip.trim(),
      occasionLabel: form.occasionLabel.trim() || null,
      notes,
      includeDelivery: form.includeDelivery,
      includeSetup: form.includeSetup,
      includeBreakdown: form.includeBreakdown,
      subtotal: quoteTotals.subtotal,
      deliveryFee: quoteTotals.deliveryFee,
      setupFee: quoteTotals.setupFee,
      breakdownFee: quoteTotals.breakdownFee,
      securityDeposit: quoteTotals.securityDeposit,
      total: quoteTotals.total,
      items: selectedItems.map(({ item, quantity }) => {
        const totals = calculateRentalQuoteTotals({
          quantity,
          baseRentalPrice: item.base_rental_price,
          priceType: item.price_type,
          depositRequired: item.deposit_required,
          depositType: item.deposit_type,
          depositAmount: item.deposit_amount,
        });

        return {
          rentalItemId: item.id,
          slug: item.slug,
          name: item.name,
          quantity,
          unitPrice: item.base_rental_price,
          priceType: item.price_type,
          lineSubtotal: totals.subtotal,
          securityDeposit: totals.securityDeposit,
        };
      }),
    };

    try {
      const inquiryRes = await fetch("/api/rental-requests", {
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
            <h2>Get a chair rental quote in a few quick steps.</h2>
            <p className="muted">
              Submit your rental request and our team will send you a custom quote based on chair quantity, event location, delivery distance, setup, and breakdown needs.
            </p>
          </div>

          <form className="rental-request-form" onSubmit={handleSubmit}>
            <div className="form-stepper" aria-label="Rental quote progress">
              {rentalSteps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className={`form-stepper__item${index === currentStep ? " is-active" : ""}${index < currentStep ? " is-complete" : ""}`}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                      setError("");
                    }
                  }}
                >
                  <span>{index + 1}</span>
                  {step}
                </button>
              ))}
            </div>

            {currentStep === 0 ? (
            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>What chairs do you need?</h3>
                <p className="muted">Choose the chair type and estimated quantity. An estimate is fine.</p>
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
            ) : null}

            {currentStep === 1 ? (
            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>Where is the event?</h3>
                <p className="muted">We use the address and ZIP code to review mileage from storage ZIP 30083.</p>
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
                    placeholder="Venue name"
                    value={form.venueName}
                    onChange={(e) => setForm((prev) => ({ ...prev, venueName: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Event address</span>
                  <input
                    type="text"
                    required
                    placeholder="Street address for delivery"
                    value={form.eventAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventAddress: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Event ZIP code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Required for mileage review"
                    value={form.eventZip}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventZip: e.target.value }))}
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
            </section>
            ) : null}

            {currentStep === 2 ? (
            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>What support do you need?</h3>
                <p className="muted">Select the logistics support you want included in the quote.</p>
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
            ) : null}

            {currentStep === 3 ? (
            <section className="rental-request-section">
              <div className="rental-request-section__head">
                <h3>Where should we send the quote?</h3>
                <p className="muted">We use this to confirm availability and send the formal rental quote.</p>
              </div>

              <div className="rental-request-fields rental-request-fields--two">
                <label>
                  <span>Customer full name</span>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
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
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}

            <div className="rental-request-actions">
              {currentStep > 0 ? (
                <Button type="button" variant="secondary" onClick={goBack}>
                  Back
                </Button>
              ) : null}
              {currentStep < rentalSteps.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit">{loading ? "Submitting..." : "Request Rental Quote"}</Button>
              )}
            </div>
          </form>
        </Card>
      </section>

      <aside className="rental-request-sidebar">
        <Card className="rental-request-summary">
          <p className="eyebrow">Admin-reviewed quote</p>
          <h3>Your custom rental quote will be prepared by our team.</h3>
          <p className="muted">
            We quote chair rentals after reviewing quantity, delivery distance from storage ZIP 30083, venue access, setup, breakdown, and refundable deposit requirements.
          </p>

          <div className="rental-request-summary__lines">
            {selectedItems.map(({ item, quantity }) => {
              return (
                <div key={item.slug} className="rental-request-summary__item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{quantity} requested</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rental-request-summary__totals">
            <div><span>Storage ZIP</span><strong>30083</strong></div>
            <div><span>Delivery</span><strong>{form.includeDelivery ? "Requested" : "Not requested"}</strong></div>
            <div><span>Setup</span><strong>{form.includeSetup ? "Requested" : "Not requested"}</strong></div>
            <div><span>Breakdown</span><strong>{form.includeBreakdown ? "Requested" : "Not requested"}</strong></div>
          </div>

          <p className="muted">
            Detailed delivery, labor, and refundable deposit pricing is reviewed by admin before the quote is sent.
          </p>
        </Card>
      </aside>
    </div>
  );
}
