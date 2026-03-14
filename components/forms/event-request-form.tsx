"use client";

import { useState } from "react";
import type { PublicVendorRecommendation } from "@/lib/vendors";
import { VENDOR_SERVICE_CATEGORIES } from "@/lib/vendors";

const serviceSections = [
  {
    title: "Package direction",
    options: ["Full decoration"],
  },
  {
    title: "Signature focal points",
    options: ["Head table styling", "Backdrop / back drape", "Sweetheart table", "Welcome sign area"],
  },
  {
    title: "Guest tables and seating",
    options: ["Guest tablescape styling", "Tablecloths and linens", "Napkins", "Charger plates", "Chair covers / styling", "Centerpieces"],
  },
  {
    title: "Room and service areas",
    options: ["Entrance decor", "Buffet table styling", "Cake table", "Ceiling draping", "Full room decor"],
  },
  {
    title: "Operations and support",
    options: ["Delivery", "Setup", "Breakdown / teardown", "On-site styling support"],
  },
];

const eventTypeOptions = [
  "Wedding",
  "Traditional (Melsi)",
  "Engagement",
  "Birthday",
  "Baby Shower",
  "Bridal Shower",
  "Graduation",
  "Corporate Event",
  "Anniversary",
  "Other",
];

const venueStatusOptions = ["Booked", "Still looking", "Home", "Church", "Hall", "Hotel / ballroom"];
const consultationOptions = ["Phone call", "Video meeting", "In-person meeting", "Text or email first"];
const referralOptions = ["Instagram", "Facebook", "Google", "Friend / referral", "Repeat client", "Other"];
const steps = [
  { id: "contact", label: "Contact" },
  { id: "event", label: "Event + Partners" },
  { id: "scope", label: "Decor + Notes" },
];

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  guestCount: "",
  venueName: "",
  venueStatus: "",
  indoorOutdoor: "",
  colorsTheme: "",
  inspirationNotes: "",
  additionalInfo: "",
  requestedVendorCategories: [] as string[],
  vendorRequestNotes: "",
  preferredContactMethod: "",
  referralSource: "",
  needsDeliverySetup: false,
  services: [] as string[],
};

function buildReviewNotes(form: typeof initialState) {
  const detailLines = [
    form.additionalInfo.trim(),
    form.preferredContactMethod
      ? `Consultation preference: ${form.preferredContactMethod}.`
      : "",
    form.referralSource ? `Referral source: ${form.referralSource}.` : "",
  ].filter(Boolean);

  return detailLines.join("\n\n");
}

function normalizeVendorCategory(category: string) {
  return category.startsWith("Other:")
    ? category.replace(/^Other:\s*/, "").trim()
    : category;
}

function getAvailableVendorCategories(vendors: PublicVendorRecommendation[]) {
  const builtIn = VENDOR_SERVICE_CATEGORIES.filter((item) => item !== "Other");
  const custom = Array.from(
    new Set(
      vendors.flatMap((vendor) =>
        (vendor.service_categories ?? [])
          .map(normalizeVendorCategory)
          .filter(Boolean)
      )
    )
  );

  return Array.from(new Set([...builtIn, ...custom]));
}

function getMatchingVendors(
  vendors: PublicVendorRecommendation[],
  requestedCategories: string[]
) {
  if (requestedCategories.length === 0) {
    return [];
  }

  return vendors.filter((vendor) =>
    requestedCategories.some((category) =>
      (vendor.service_categories ?? []).some(
        (item) => normalizeVendorCategory(item) === category
      )
    )
  );
}

export default function EventRequestForm({
  vendors,
}: {
  vendors: PublicVendorRecommendation[];
}) {
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const missingCoreInfo = !form.firstName || !form.lastName || !form.email || !form.phone;
  const missingEventInfo = !form.eventType || !form.eventDate;
  const missingScope = form.services.length === 0;
  const hasFullDecoration = form.services.includes("Full decoration");
  const vendorCategories = getAvailableVendorCategories(vendors);
  const matchingVendors = getMatchingVendors(vendors, form.requestedVendorCategories);
  const visibleServiceSections = hasFullDecoration
    ? serviceSections.filter((section) => section.title === "Package direction")
    : serviceSections;

  function updateField(name: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleService(service: string) {
    if (service === "Full decoration") {
      setForm((prev) => ({
        ...prev,
        services: prev.services.includes("Full decoration")
          ? []
          : ["Full decoration"],
      }));
      return;
    }

    setForm((prev) => {
      const nextServices = prev.services.includes("Full decoration")
        ? []
        : prev.services;

      return {
        ...prev,
        services: nextServices.includes(service)
          ? nextServices.filter((s) => s !== service)
          : [...nextServices, service],
      };
    });
  }

  function toggleVendorCategory(category: string) {
    setForm((prev) => ({
      ...prev,
      requestedVendorCategories: prev.requestedVendorCategories.includes(category)
        ? prev.requestedVendorCategories.filter((item) => item !== category)
        : [...prev.requestedVendorCategories, category],
    }));
  }

  function nextStep() {
    if (step === 0 && missingCoreInfo) {
      setError("Add your name, email, and phone before continuing.");
      return;
    }

    if (step === 1 && missingEventInfo) {
      setError("Add the event type and date before continuing.");
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missingScope) {
      setError("Select at least one decor area so the request is useful.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        additionalInfo: buildReviewNotes(form),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Submission failed.");
      setLoading(false);
      return;
    }

    setSuccess("Quote request submitted successfully.");
    setForm(initialState);
    setStep(0);
    setLoading(false);
  }

  return (
    <div className="booking-shell">
      <section className="booking-hero card">
        <div>
          <p className="eyebrow">Booking flow</p>
          <h3>Guide the client through the decisions that actually shape the quote.</h3>
          <p className="muted">
            A flat inquiry form is weak. Clients forget important decor areas, and then you end up doing discovery by phone anyway.
            This version collects the high-signal details up front without forcing contract-level complexity too early.
          </p>
        </div>
        <div className="booking-stepbar" aria-label="Booking steps">
          {steps.map((item, index) => (
            <div
              key={item.id}
              className={`booking-step ${index === step ? "current" : ""} ${index < step ? "done" : ""}`}
            >
              <span>{index + 1}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="form-wrap booking-layout">
        <div className="card form-card booking-form-card">
          <form onSubmit={handleSubmit}>
            {step === 0 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 1</p>
                  <h3>Who is planning the event?</h3>
                  <p className="muted">
                    Capture the right person and how they want the first conversation to happen.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label className="label">First Name</label>
                    <input className="input" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Last Name</label>
                    <input className="input" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Email</label>
                    <input className="input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Phone</label>
                    <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                  </div>
                </div>

                <div className="field">
                  <label className="label">How should we start the consultation?</label>
                  <div className="option-pills">
                    {consultationOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.preferredContactMethod === option ? "selected" : ""}`}
                        onClick={() => updateField("preferredContactMethod", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">How did you hear about us?</label>
                  <div className="option-pills">
                    {referralOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.referralSource === option ? "selected" : ""}`}
                        onClick={() => updateField("referralSource", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {step === 1 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 2</p>
                  <h3>Tell us about the event itself.</h3>
                  <p className="muted">
                    This is the minimum context needed before anyone should spend time quoting.
                  </p>
                </div>

                <div className="field">
                  <label className="label">Event Type</label>
                  <div className="option-pills">
                    {eventTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.eventType === option ? "selected" : ""}`}
                        onClick={() => updateField("eventType", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label className="label">Event Date</label>
                    <input className="input" type="date" value={form.eventDate} onChange={(e) => updateField("eventDate", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Estimated Guest Count</label>
                    <input className="input" type="number" min="0" value={form.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Venue Name</label>
                    <input className="input" value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Indoor / Outdoor</label>
                    <input className="input" value={form.indoorOutdoor} onChange={(e) => updateField("indoorOutdoor", e.target.value)} placeholder="Indoor, outdoor, or mixed" />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Venue Status</label>
                  <div className="option-pills">
                    {venueStatusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.venueStatus === option ? "selected" : ""}`}
                        onClick={() => updateField("venueStatus", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">Colors / Theme</label>
                  <input className="input" value={form.colorsTheme} onChange={(e) => updateField("colorsTheme", e.target.value)} placeholder="Examples: blush and gold, modern white, royal blue, garden glam" />
                </div>

                <div className="field">
                  <label className="label">Need help with trusted partner vendors too?</label>
                  <p className="muted" style={{ marginTop: "0", marginBottom: "12px" }}>
                    This belongs with event planning, not decor only. Venue, catering, photography, sound, and other partner vendors can be requested here.
                  </p>
                  <div className="option-pills">
                    {vendorCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`pill ${form.requestedVendorCategories.includes(category) ? "selected" : ""}`}
                        onClick={() => toggleVendorCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {form.requestedVendorCategories.length ? (
                  <div className="review-card vendor-recommendations">
                    <h4>Approved partner recommendations</h4>
                    <p className="muted">
                      These are approved partners we can coordinate with based on the type of help you requested.
                    </p>
                    <div className="vendor-card-grid">
                      {matchingVendors.length ? (
                        matchingVendors.slice(0, 6).map((vendor) => (
                          <div key={vendor.id} className="vendor-card">
                            <strong>{vendor.business_name}</strong>
                            <p className="muted">
                              {(vendor.service_categories ?? [])
                                .map(normalizeVendorCategory)
                                .join(", ") || "Vendor partner"}
                            </p>
                            <p className="muted">
                              {vendor.service_area || [vendor.city, vendor.state].filter(Boolean).join(", ") || "Service area not listed"}
                            </p>
                            {vendor.website_url ? (
                              <a href={vendor.website_url} target="_blank" rel="noreferrer" className="link-inline">
                                View website
                              </a>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          We do not have a visible approved vendor listed for those categories yet, but you can still request help and we can recommend manually.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === 2 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 3</p>
                  <h3>What parts of the decor do you want help with?</h3>
                  <p className="muted">
                    This is where the form becomes useful. Keep it focused on the decor scope and the notes that actually shape the consultation.
                  </p>
                </div>

                <div className="scope-sections">
                  {visibleServiceSections.map((section) => (
                    <div key={section.title} className="scope-card">
                      <h4>{section.title}</h4>
                      <div className="option-pills">
                        {section.options.map((service) => (
                          <button
                            key={service}
                            type="button"
                            className={`pill ${form.services.includes(service) ? "selected" : ""}`}
                            onClick={() => toggleService(service)}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {hasFullDecoration ? (
                  <p className="muted">
                    Full decoration is selected, so the individual decor items are intentionally ignored for now.
                    You can break the scope down later after the consultation.
                  </p>
                ) : null}

                <div className="field">
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={form.needsDeliverySetup}
                      onChange={(e) => updateField("needsDeliverySetup", e.target.checked)}
                    />
                    <span>We need delivery, setup, or teardown support built into the quote.</span>
                  </label>
                </div>

                <div className="field">
                  <label className="label">Inspiration, style notes, or must-have details</label>
                  <textarea
                    className="textarea"
                    value={form.inspirationNotes}
                    onChange={(e) => updateField("inspirationNotes", e.target.value)}
                    placeholder="Tell us the look you want, what matters most, and anything we should plan around."
                  />
                </div>

                <div className="field">
                  <label className="label">Anything else we should know before the consultation?</label>
                  <textarea
                    className="textarea"
                    value={form.additionalInfo}
                    onChange={(e) => updateField("additionalInfo", e.target.value)}
                    placeholder="Budget expectations, timing constraints, rental needs, venue rules, or family priorities."
                  />
                </div>

                {form.requestedVendorCategories.length ? (
                  <div className="field">
                    <label className="label">Any notes about the vendors you want?</label>
                    <textarea
                      className="textarea"
                      value={form.vendorRequestNotes}
                      onChange={(e) => updateField("vendorRequestNotes", e.target.value)}
                      placeholder="Budget range, style preference, location, language, or anything we should know before recommending vendors."
                    />
                  </div>
                ) : null}

                <div className="review-card">
                  <h4>Review before submitting</h4>
                  <div className="review-grid">
                    <p><strong>Client:</strong> {form.firstName || "—"} {form.lastName || ""}</p>
                    <p><strong>Event:</strong> {form.eventType || "—"}</p>
                    <p><strong>Date:</strong> {form.eventDate || "—"}</p>
                    <p><strong>Venue:</strong> {form.venueName || "—"}</p>
                    <p><strong>Consultation:</strong> {form.preferredContactMethod || "—"}</p>
                    <p><strong>Scope items:</strong> {form.services.length}</p>
                    <p><strong>Vendor help:</strong> {form.requestedVendorCategories.length ? form.requestedVendorCategories.join(", ") : "Not requested"}</p>
                  </div>
                </div>

              </section>
            ) : null}

            {success ? <p className="success">{success}</p> : null}
            {error ? <p className="error">{error}</p> : null}

            <div className="booking-actions">
              <button type="button" className="btn secondary" onClick={previousStep} disabled={step === 0 || loading}>
                Back
              </button>

              {step < steps.length - 1 ? (
                <button type="button" className="btn" onClick={nextStep}>
                  Continue
                </button>
              ) : (
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Quote Request"}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="card sidebar-box booking-summary">
          <p className="eyebrow">Request summary</p>
          <h3 style={{ marginTop: 0 }}>No public pricing shown</h3>
          <p className="muted">
            Pricing is reviewed after we understand the scope, rentals, labor,
            and venue logistics. That is the right workflow for a negotiable
            service business.
          </p>

          <div className="summary-stack">
            <div>
              <strong>Event</strong>
              <p className="muted">{form.eventType || "Not selected yet"}</p>
            </div>
            <div>
              <strong>Date & venue</strong>
              <p className="muted">
                {form.eventDate || "Date not added"}
                {form.venueName ? ` • ${form.venueName}` : ""}
              </p>
            </div>
            <div>
              <strong>Consultation</strong>
              <p className="muted">{form.preferredContactMethod || "We will contact you based on your preference"}</p>
            </div>
            <div>
              <strong>Selected decor areas</strong>
              <div className="summary-pills">
                {form.services.length > 0 ? (
                  form.services.map((service) => (
                    <span key={service} className="summary-chip">
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="muted">No scope selected yet.</p>
                )}
              </div>
            </div>
            <div>
              <strong>Partner vendors</strong>
              <div className="summary-pills">
                {form.requestedVendorCategories.length > 0 ? (
                  form.requestedVendorCategories.map((category) => (
                    <span key={category} className="summary-chip">
                      {category}
                    </span>
                  ))
                ) : (
                  <p className="muted">No vendor recommendations requested.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
