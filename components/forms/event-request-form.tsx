"use client";

import { useMemo, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";
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
const guestCountRangeOptions = [
  { label: "Under 50", value: "Under 50", hint: "Intimate rooms and focused styling." },
  { label: "50-100", value: "50–100", hint: "Balanced room styling with guest tables and focal pieces." },
  { label: "100-200", value: "100–200", hint: "Larger room layout with stronger visual anchors." },
  { label: "200+", value: "200+", hint: "Full-room atmosphere and guest-flow planning." },
];
const decorStyleOptions = [
  "Classic elegance",
  "Soft romantic",
  "Modern clean",
  "Garden luxe",
  "Traditional ceremony",
  "Bold glam",
];
const venueTypeOptions = [
  "Ballroom / hotel",
  "Banquet hall",
  "Church reception",
  "Private home",
  "Outdoor garden",
  "Mixed indoor-outdoor",
];
const budgetRangeOptions = [
  "Under $3,000",
  "$3,000-$5,000",
  "$5,000-$8,000",
  "$8,000+",
];
const paletteSuggestions = [
  "Ivory + champagne",
  "White + gold",
  "Blush + ivory",
  "Sage + cream",
  "Terracotta + candlelight",
  "Emerald + gold",
];
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
  guestCountRange: "",
  indoorOutdoor: "",
  decorStyle: "",
  venueType: "",
  budgetRange: "",
  colorsTheme: "",
  inspirationNotes: "",
  visionBoardUrls: [] as string[],
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
    form.guestCountRange ? `Guest count range: ${form.guestCountRange}.` : "",
    form.decorStyle ? `Preferred decor style: ${form.decorStyle}.` : "",
    form.venueType ? `Venue type: ${form.venueType}.` : "",
    form.budgetRange ? `Budget range: ${form.budgetRange}.` : "",
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
  portfolioItems,
}: {
  vendors: PublicVendorRecommendation[];
  portfolioItems: GalleryItem[];
}) {
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingVisionBoard, setUploadingVisionBoard] = useState(false);

  const missingCoreInfo = !form.firstName || !form.lastName || !form.email || !form.phone;
  const missingEventInfo = !form.eventType || !form.eventDate;
  const missingScope = form.services.length === 0;
  const hasFullDecoration = form.services.includes("Full decoration");
  const vendorCategories = getAvailableVendorCategories(vendors);
  const matchingVendors = getMatchingVendors(vendors, form.requestedVendorCategories);
  const visibleServiceSections = hasFullDecoration
    ? serviceSections.filter((section) => section.title === "Package direction")
    : serviceSections;

  const preview = useMemo(() => {
    const eventNeedles = [form.eventType, form.decorStyle, form.venueType, form.colorsTheme]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    const matchedImages = portfolioItems
      .filter((item) => {
        const haystack = `${item.title} ${item.category ?? ""}`.toLowerCase();
        if (eventNeedles.length === 0) {
          return true;
        }
        return eventNeedles.some((needle) => haystack.includes(needle.split(" ")[0]));
      })
      .slice(0, 4);

    const images = matchedImages.length ? matchedImages : portfolioItems.slice(0, 4);
    const eventLabel = form.eventType || "your event";
    const styleLabel = form.decorStyle || "elevated and guest-ready";
    const paletteLabel = form.colorsTheme || "a refined palette";
    const venueLabel = form.venueType || form.venueStatus || "the room";
    const guestLabel = form.guestCountRange || (form.guestCount ? `${form.guestCount} guests` : "the guest count");
    const styleDescription = `${eventLabel} with a ${styleLabel.toLowerCase()} direction, ${paletteLabel.toLowerCase()}, and layout choices shaped around ${venueLabel.toLowerCase()} for ${guestLabel.toLowerCase()}.`;

    const decorDirection = hasFullDecoration
      ? "Full-room styling with a strong focal installation, guest-table rhythm, and coordinated setup support."
      : form.services.length
        ? `${form.services.slice(0, 3).join(", ")}${form.services.length > 3 ? ", and supporting details" : ""} as the main visual anchors.`
        : "A focal-point-led room with one hero installation and polished guest-facing details.";

    const packageRecommendation = hasFullDecoration
      ? "Best fit: a full-design package with room styling, focal installations, and setup support."
      : (form.guestCountRange === "200+" || form.budgetRange === "$8,000+")
        ? "Best fit: a custom large-event package with layered room styling and logistics support."
        : "Best fit: a focused decor package centered on your main focal points and guest-table styling.";

    return {
      images,
      styleDescription,
      decorDirection,
      packageRecommendation,
    };
  }, [
    form.budgetRange,
    form.colorsTheme,
    form.decorStyle,
    form.eventType,
    form.guestCount,
    form.guestCountRange,
    form.services,
    form.venueStatus,
    form.venueType,
    hasFullDecoration,
    portfolioItems,
  ]);

  function updateField(name: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleVisionBoardUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (form.visionBoardUrls.length + files.length > 5) {
      setError("Upload up to 5 inspiration images.");
      e.target.value = "";
      return;
    }

    setUploadingVisionBoard(true);
    setError("");

    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("files", file));

      const res = await fetch("/api/inquiries/vision-board", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload vision board images.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        visionBoardUrls: [...prev.visionBoardUrls, ...(data.urls ?? [])],
      }));
    } catch {
      setError("Something went wrong while uploading inspiration images.");
    } finally {
      setUploadingVisionBoard(false);
      e.target.value = "";
    }
  }

  function removeVisionBoardImage(url: string) {
    setForm((prev) => ({
      ...prev,
      visionBoardUrls: prev.visionBoardUrls.filter((item) => item !== url),
    }));
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

    setSuccess("Your consultation request has been received.");
    setForm(initialState);
    setStep(0);
    setLoading(false);
  }

  return (
    <div className="booking-shell">
      <section className="booking-hero card">
        <div>
          <p className="eyebrow">Consultation request</p>
          <h3>Share the essentials, then we’ll guide the next step.</h3>
          <p className="muted">
            Keep the form light, choose the decor direction, and let the live preview help you picture the room.
          </p>
          <p className="booking-preview-intro">
            As you choose event details, the live preview updates with real portfolio images and a matching decor direction.
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
                    Let us know who to contact and how you want the first conversation to happen.
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
                    Share the key details so we can understand the celebration and guide the right consultation.
                  </p>
                </div>

                <div className="field">
                  <label className="label">Event Type</label>
                  <div className="visual-choice-grid">
                    {eventTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`choice-card ${form.eventType === option ? "selected" : ""}`}
                        onClick={() => updateField("eventType", option)}
                      >
                        <strong>{option}</strong>
                        <span>
                          {option === "Wedding" ? "Reception styling, focal tables, and guest-room atmosphere." :
                           option === "Traditional (Melsi)" ? "Traditional next-day styling with cultural detail and flow." :
                           option === "Corporate Event" ? "Clean, polished guest-facing styling for hosted experiences." :
                           "Styled event atmosphere with curated focal points."}
                        </span>
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
                    <label className="label">Exact Guest Count, if known</label>
                    <input className="input" type="number" min="0" value={form.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} placeholder="Optional exact count" />
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
                  <label className="label">Guest Count Range</label>
                  <div className="visual-choice-grid visual-choice-grid--compact">
                    {guestCountRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`choice-card choice-card--compact ${form.guestCountRange === option.value ? "selected" : ""}`}
                        onClick={() => updateField("guestCountRange", option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.hint}</span>
                      </button>
                    ))}
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
                  <label className="label">Venue Type</label>
                  <div className="option-pills">
                    {venueTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.venueType === option ? "selected" : ""}`}
                        onClick={() => updateField("venueType", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">Decor Style</label>
                  <div className="option-pills">
                    {decorStyleOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.decorStyle === option ? "selected" : ""}`}
                        onClick={() => updateField("decorStyle", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">Color Palette</label>
                  <div className="option-pills">
                    {paletteSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.colorsTheme === option ? "selected" : ""}`}
                        onClick={() => updateField("colorsTheme", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <input className="input" value={form.colorsTheme} onChange={(e) => updateField("colorsTheme", e.target.value)} placeholder="Or type your own palette or theme" style={{ marginTop: "12px" }} />
                </div>

                <div className="field">
                  <label className="label">Budget Direction</label>
                  <div className="option-pills">
                    {budgetRangeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.budgetRange === option ? "selected" : ""}`}
                        onClick={() => updateField("budgetRange", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">Need help with trusted partner vendors too?</label>
                  <p className="muted" style={{ marginTop: "0", marginBottom: "12px" }}>
                    If you also need help with venues, catering, photography, planning, or sound, you can request trusted recommendations here.
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
                    Choose the decor areas that matter most so we can prepare for a useful, focused consultation.
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
                    You selected full decoration. We can refine the individual details together during the consultation.
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
                  <label className="label">Upload inspiration or vision-board images</label>
                  <p className="muted" style={{ marginTop: "0", marginBottom: "12px" }}>
                    Upload up to 5 inspiration images so we can understand your
                    style quickly and prepare more thoughtfully for the consultation.
                  </p>
                  <label className="vision-board-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleVisionBoardUpload}
                      disabled={uploadingVisionBoard || form.visionBoardUrls.length >= 5}
                    />
                    <strong>
                      {uploadingVisionBoard ? "Uploading..." : "Add inspiration images"}
                    </strong>
                    <span>
                      {form.visionBoardUrls.length}/5 uploaded
                    </span>
                  </label>

                  {form.visionBoardUrls.length ? (
                    <div className="vision-board-grid">
                      {form.visionBoardUrls.map((url, index) => (
                        <div key={url} className="vision-board-item">
                          <img src={url} alt={`Vision board ${index + 1}`} />
                          <button
                            type="button"
                            className="vision-board-remove"
                            onClick={() => removeVisionBoardImage(url)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
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
                  Next Step
                </button>
              ) : (
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Send Consultation Request"}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="card sidebar-box booking-summary">
          <span className="booking-live-pill">Live Preview</span>
          <p className="eyebrow">Design direction preview</p>
          <h3 style={{ marginTop: 0 }}>Inspiration based on your selections</h3>
          <p className="muted">
            This preview helps you picture the direction. Final concepts are customized during your consultation.
          </p>

          <div className="booking-preview-grid">
            {preview.images.map((item) => (
              <div key={item.id} className="booking-preview-image">
                <img src={item.image_url} alt={item.title} />
                <span>{item.category || "Portfolio"}</span>
              </div>
            ))}
          </div>

          <div className="summary-stack">
            <div className="booking-preview-copy">
              <strong>Style snapshot</strong>
              <p className="muted">{preview.styleDescription}</p>
            </div>
            <div className="booking-preview-copy">
              <strong>Recommended decor direction</strong>
              <p className="muted">{preview.decorDirection}</p>
            </div>
            <div className="booking-preview-copy">
              <strong>Suggested package path</strong>
              <p className="muted">{preview.packageRecommendation}</p>
            </div>
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
              <p className="muted">{form.preferredContactMethod || "We will follow up using your preferred contact method"}</p>
            </div>
            <div>
              <strong>Palette + style</strong>
              <p className="muted">
                {[form.colorsTheme, form.decorStyle].filter(Boolean).join(" • ") || "Still open for consultation"}
              </p>
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

          <p className="booking-preview-note">
            Inspiration preview only. Final concept, florals, rentals, and exact room design are refined during consultation.
          </p>
        </aside>
      </div>
    </div>
  );
}
