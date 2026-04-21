"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import type { GalleryItem } from "@/lib/gallery";
import type { SiteSocialLinks } from "@/lib/social-links";
import type { PublicVendorRecommendation } from "@/lib/vendors";

type EventRequestFormProps = {
  vendors: PublicVendorRecommendation[];
  portfolioItems: GalleryItem[];
  socialLinks: SiteSocialLinks;
};

type StepKey =
  | "basics"
  | "vision"
  | "decor"
  | "experience"
  | "contact"
  | "summary";

type FormState = {
  eventType: string;
  eventDate: string;
  guestCount: string;
  location: string;
  styles: string[];
  decorElements: string[];
  priority: string;
  eventScale: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

type SubmittedSummary = {
  name: string;
  eventType: string;
  rawEventDate: string;
  eventDate: string;
  guestCount: string;
  location: string;
  styles: string[];
  decorElements: string[];
  priority: string;
  eventScale: string;
  inspirationCount: number;
};

const steps: Array<{
  key: StepKey;
  eyebrow: string;
  title: string;
  blurb: string;
}> = [
  {
    key: "basics",
    eyebrow: "Step 1",
    title: "Event basics",
    blurb: "Start with the essentials so we can frame the celebration correctly.",
  },
  {
    key: "vision",
    eyebrow: "Step 2",
    title: "Design vision",
    blurb: "Share the atmosphere you want the room to carry from the first impression.",
  },
  {
    key: "decor",
    eyebrow: "Step 3",
    title: "Decor elements",
    blurb: "Select the statement pieces you want us to shape into the overall experience.",
  },
  {
    key: "experience",
    eyebrow: "Step 4",
    title: "Experience preferences",
    blurb: "Tell us how you want the event to feel and what matters most in the design process.",
  },
  {
    key: "contact",
    eyebrow: "Step 5",
    title: "Contact details",
    blurb: "Add the best details for follow-up so we can respond within 12 to 24 hours.",
  },
  {
    key: "summary",
    eyebrow: "Final step",
    title: "Review your request",
    blurb: "Confirm the vision before you move into consultation.",
  },
];

const eventTypeOptions = [
  { value: "Wedding", label: "Wedding", imageFallback: "/hero1.jpeg" },
  { value: "Traditional (Melsi)", label: "Cultural", imageFallback: "/hero2.jpeg" },
  { value: "Corporate Event", label: "Corporate", imageFallback: "/hero1.jpeg" },
] as const;

const styleOptions = ["Elegant", "Modern", "Cultural", "Romantic"] as const;

const decorOptions = [
  { value: "Backdrop", imageFallback: "/hero2.jpeg" },
  { value: "Head Table", imageFallback: "/hero1.jpeg" },
  { value: "Sweetheart Table", imageFallback: "/hero2.jpeg" },
  { value: "Centerpieces", imageFallback: "/hero1.jpeg" },
  { value: "Ceiling Draping", imageFallback: "/hero2.jpeg" },
  { value: "Welcome Sign", imageFallback: "/hero1.jpeg" },
] as const;

const priorityOptions = [
  { value: "Quality", description: "A refined final result matters most." },
  { value: "Budget", description: "Strong impact with disciplined spending matters most." },
  { value: "Experience", description: "Guest impression and atmosphere matter most." },
] as const;

const eventScaleOptions = [
  { value: "Intimate", description: "A softer, more personal room energy." },
  { value: "Luxury", description: "Elevated styling with polished details." },
  { value: "Grand", description: "A larger statement with immersive presence." },
] as const;

const guestCountOptions = [
  { value: "40", label: "Under 50" },
  { value: "75", label: "50-100" },
  { value: "150", label: "100-200" },
  { value: "250", label: "200+" },
] as const;

const initialState: FormState = {
  eventType: "",
  eventDate: "",
  guestCount: "",
  location: "",
  styles: [],
  decorElements: [],
  priority: "",
  eventScale: "",
  name: "",
  email: "",
  phone: "",
  message: "",
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "Guest",
      lastName: "Client",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function formatEventDate(date: string) {
  if (!date) {
    return "Not specified";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarUrl(eventDate: string, title: string) {
  if (!eventDate) {
    return "";
  }

  const start = new Date(`${eventDate}T10:00:00`);
  const end = new Date(`${eventDate}T10:30:00`);

  const format = (value: Date) =>
    value.toISOString().replace(/[-:]/g, "").replace(".000", "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(start)}/${format(end)}`;
}

export default function EventRequestForm({
  vendors: _vendors,
  portfolioItems,
  socialLinks,
}: EventRequestFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedSummary | null>(null);

  useEffect(() => {
    const nextPreviews = inspirationFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [inspirationFiles]);

  const currentStep = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const galleryFallbacks = useMemo(() => {
    return portfolioItems.map((item) => item.image_url).filter(Boolean);
  }, [portfolioItems]);

  const summaryItems = useMemo(
    () => [
      { label: "Event type", value: form.eventType || "Not selected" },
      { label: "Event date", value: formatEventDate(form.eventDate) },
      { label: "Guest count", value: guestCountOptions.find((item) => item.value === form.guestCount)?.label || "Not selected" },
      { label: "Location", value: form.location || "Not provided" },
      { label: "Design style", value: form.styles.length ? form.styles.join(", ") : "Not selected" },
      { label: "Decor focus", value: form.decorElements.length ? form.decorElements.join(", ") : "Not selected" },
      { label: "Top priority", value: form.priority || "Not selected" },
      { label: "Event feel", value: form.eventScale || "Not selected" },
    ],
    [form]
  );

  function getImage(index: number, fallback: string) {
    return galleryFallbacks[index] || fallback;
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function toggleMultiValue(key: "styles" | "decorElements", value: string) {
    setForm((current) => {
      const values = current[key];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [key]: nextValues };
    });
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 5);
    setInspirationFiles(files);
  }

  function removeInspirationFile(index: number) {
    setInspirationFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function validateStep(index: number) {
    const nextErrors: Record<string, string> = {};

    if (index === 0) {
      if (!form.eventType) nextErrors.eventType = "Select the event type.";
      if (!form.eventDate) nextErrors.eventDate = "Choose the event date.";
      if (!form.guestCount) nextErrors.guestCount = "Choose a guest count range.";
      if (!form.location.trim()) nextErrors.location = "Add the event location or venue area.";
    }

    if (index === 1 && form.styles.length === 0) {
      nextErrors.styles = "Choose at least one design direction.";
    }

    if (index === 2 && form.decorElements.length === 0) {
      nextErrors.decorElements = "Select at least one decor element.";
    }

    if (index === 3) {
      if (!form.priority) nextErrors.priority = "Choose what matters most.";
      if (!form.eventScale) nextErrors.eventScale = "Choose the event feel.";
    }

    if (index === 4) {
      if (form.name.trim().length < 2) nextErrors.name = "Add your name.";
      if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Enter a valid email.";
      if (form.phone.trim().length < 7) nextErrors.phone = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function uploadInspirationFiles(files: File[]) {
    if (!files.length) {
      return [] as string[];
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/inquiries/vision-board", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to upload inspiration images.");
    }

    return Array.isArray(payload.urls) ? payload.urls : [];
  }

  async function handleSubmit() {
    if (!validateStep(4)) {
      setStepIndex(4);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const uploadedUrls = await uploadInspirationFiles(inspirationFiles);
      const { firstName, lastName } = splitName(form.name);
      const selectedGuestOption = guestCountOptions.find((item) => item.value === form.guestCount);
      const additionalInfo = [
        `Primary priority: ${form.priority}.`,
        `Desired event feel: ${form.eventScale}.`,
        form.message.trim() ? `Client note: ${form.message.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const decorSelections = form.decorElements.map((element) => ({
        categoryKey: element.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        categoryTitle: element,
        selectedGalleryImageIds: [],
        selectedGalleryImages: [],
        uploadedImageUrls: uploadedUrls,
        refinement: form.styles.join(", ") || null,
        notes: form.message.trim() || null,
        sizeOption: null,
        floralDensity: null,
        colorPalette: null,
        inspirationLink: null,
        designerLed: true,
      }));

      const inquiryPayload = {
        firstName,
        lastName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate || null,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        venueName: form.location.trim() || null,
        venueStatus: null,
        services: form.decorElements,
        indoorOutdoor: null,
        colorsTheme: form.styles.join(", ") || null,
        inspirationNotes: form.message.trim() || null,
        visionBoardUrls: uploadedUrls,
        selectedDecorCategories: decorSelections.map((item) => item.categoryKey),
        decorSelections,
        additionalInfo,
        requestedVendorCategories: [],
        vendorRequestNotes: null,
        preferredContactMethod: "email",
        consultationPreferenceDate: null,
        consultationPreferenceTime: null,
        consultationVideoPlatform: null,
        referralSource: "website_quote_request",
        needsDeliverySetup: true,
      };

      const inquiryResponse = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryPayload),
      });

      const inquiryResult = await inquiryResponse.json().catch(() => ({}));
      if (!inquiryResponse.ok) {
        throw new Error(inquiryResult.error || "Failed to submit your request.");
      }

      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          eventDate: form.eventDate,
          guestCount: selectedGuestOption?.label || "",
          notes: additionalInfo,
        }),
      }).catch(() => null);

      setSubmittedSummary({
        name: form.name.trim(),
        eventType: form.eventType,
        rawEventDate: form.eventDate,
        eventDate: formatEventDate(form.eventDate),
        guestCount: selectedGuestOption?.label || "Not specified",
        location: form.location.trim() || "Not specified",
        styles: form.styles,
        decorElements: form.decorElements,
        priority: form.priority,
        eventScale: form.eventScale,
        inspirationCount: uploadedUrls.length,
      });
      setSuccess(true);
      setForm(initialState);
      setInspirationFiles([]);
      setStepIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (!validateStep(stepIndex)) {
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (success && submittedSummary) {
    const calendarReminderUrl = buildCalendarUrl(
      submittedSummary.rawEventDate,
      `${submittedSummary.eventType} consultation with Elel Events`
    );

    return (
      <Card className="luxury-request luxury-request--success">
        <div className="luxury-request-success-copy">
          <p className="eyebrow">Request received</p>
          <h2>Your consultation request is in.</h2>
          <p className="muted">
            We received your design brief and will respond within 12 to 24 hours with the next steps.
          </p>
        </div>

        <div className="luxury-request-success-grid">
          <div className="luxury-request-summary-card">
            <p className="eyebrow">Your event summary</p>
            <ul>
              <li><strong>Name</strong><span>{submittedSummary.name}</span></li>
              <li><strong>Event</strong><span>{submittedSummary.eventType}</span></li>
              <li><strong>Date</strong><span>{submittedSummary.eventDate}</span></li>
              <li><strong>Guests</strong><span>{submittedSummary.guestCount}</span></li>
              <li><strong>Location</strong><span>{submittedSummary.location}</span></li>
              <li><strong>Style</strong><span>{submittedSummary.styles.join(", ") || "Not specified"}</span></li>
              <li><strong>Decor</strong><span>{submittedSummary.decorElements.join(", ") || "Not specified"}</span></li>
              <li><strong>Priority</strong><span>{submittedSummary.priority}</span></li>
            </ul>
          </div>

          <div className="luxury-request-success-actions">
            <p className="eyebrow">While you wait</p>
            <div className="luxury-request-button-stack">
              <Button href="/portfolio">View Portfolio</Button>
              <Button variant="secondary" href={calendarReminderUrl || "/contact"}>
                {calendarReminderUrl ? "Add a reminder" : "Contact us"}
              </Button>
            </div>
            {(socialLinks.instagramUrl || socialLinks.facebookUrl || socialLinks.tiktokUrl) && (
              <div className="luxury-request-socials">
                <span>Follow Elel Events</span>
                <div>
                  {socialLinks.instagramUrl && <a href={socialLinks.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
                  {socialLinks.facebookUrl && <a href={socialLinks.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}
                  {socialLinks.tiktokUrl && <a href={socialLinks.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="luxury-request">
      <div className="luxury-request-progress">
        <div className="luxury-request-progress-head">
          <div>
            <p className="eyebrow">{currentStep.eyebrow}</p>
            <h2>{currentStep.title}</h2>
            <p className="muted">{currentStep.blurb}</p>
          </div>
          <span>{stepIndex + 1} / {steps.length}</span>
        </div>
        <div className="luxury-request-progress-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="luxury-request-progress-steps">
          {steps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              className={`luxury-request-step-pill ${index === stepIndex ? "is-active" : ""} ${index < stepIndex ? "is-complete" : ""}`}
              onClick={() => setStepIndex(index)}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>

      <div className="luxury-request-stage">
        {currentStep.key === "basics" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-card-grid luxury-request-card-grid--three">
              {eventTypeOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`luxury-request-image-card ${form.eventType === option.value ? "is-selected" : ""}`}
                  onClick={() => updateField("eventType", option.value)}
                >
                  <img src={getImage(index, option.imageFallback)} alt={option.label} />
                  <div>
                    <strong>{option.label}</strong>
                    <span>{option.label === "Cultural" ? "Traditional ceremonies and cultural celebrations" : `${option.label} design planning`}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.eventType && <p className="luxury-request-error">{errors.eventType}</p>}

            <div className="luxury-request-field-grid luxury-request-field-grid--two">
              <label className="luxury-request-field">
                <span>Event date</span>
                <input type="date" value={form.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} />
                {errors.eventDate && <em>{errors.eventDate}</em>}
              </label>

              <label className="luxury-request-field">
                <span>Guest count</span>
                <select value={form.guestCount} onChange={(event) => updateField("guestCount", event.target.value)}>
                  <option value="">Select guest count</option>
                  {guestCountOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.guestCount && <em>{errors.guestCount}</em>}
              </label>
            </div>

            <label className="luxury-request-field">
              <span>Location</span>
              <input
                type="text"
                placeholder="City, venue, or area"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
              />
              {errors.location && <em>{errors.location}</em>}
            </label>
          </div>
        )}

        {currentStep.key === "vision" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-chip-group">
              {styleOptions.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`luxury-request-chip ${form.styles.includes(style) ? "is-selected" : ""}`}
                  onClick={() => toggleMultiValue("styles", style)}
                >
                  {style}
                </button>
              ))}
            </div>
            {errors.styles && <p className="luxury-request-error">{errors.styles}</p>}

            <label className="luxury-request-upload">
              <div>
                <strong>Upload inspiration</strong>
                <span>Share up to 5 images that help us understand the room mood, floral direction, or focal styling you love.</span>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} />
            </label>

            {inspirationFiles.length > 0 && (
              <div className="luxury-request-upload-grid">
                {inspirationFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="luxury-request-upload-card">
                    <img src={filePreviews[index]} alt={file.name} />
                    <div>
                      <strong>{file.name}</strong>
                      <button type="button" onClick={() => removeInspirationFile(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep.key === "decor" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-card-grid luxury-request-card-grid--three">
              {decorOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`luxury-request-image-card luxury-request-image-card--compact ${form.decorElements.includes(option.value) ? "is-selected" : ""}`}
                  onClick={() => toggleMultiValue("decorElements", option.value)}
                >
                  <img src={getImage(index + 1, option.imageFallback)} alt={option.value} />
                  <div>
                    <strong>{option.value}</strong>
                  </div>
                </button>
              ))}
            </div>
            {errors.decorElements && <p className="luxury-request-error">{errors.decorElements}</p>}
          </div>
        )}

        {currentStep.key === "experience" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-question-block">
              <p className="eyebrow">What matters most?</p>
              <div className="luxury-request-choice-grid">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`luxury-request-choice-card ${form.priority === option.value ? "is-selected" : ""}`}
                    onClick={() => updateField("priority", option.value)}
                  >
                    <strong>{option.value}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
              {errors.priority && <p className="luxury-request-error">{errors.priority}</p>}
            </div>

            <div className="luxury-request-question-block">
              <p className="eyebrow">What event atmosphere fits best?</p>
              <div className="luxury-request-choice-grid">
                {eventScaleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`luxury-request-choice-card ${form.eventScale === option.value ? "is-selected" : ""}`}
                    onClick={() => updateField("eventScale", option.value)}
                  >
                    <strong>{option.value}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
              {errors.eventScale && <p className="luxury-request-error">{errors.eventScale}</p>}
            </div>
          </div>
        )}

        {currentStep.key === "contact" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-field-grid luxury-request-field-grid--two">
              <label className="luxury-request-field">
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                {errors.name && <em>{errors.name}</em>}
              </label>

              <label className="luxury-request-field">
                <span>Phone</span>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
                {errors.phone && <em>{errors.phone}</em>}
              </label>
            </div>

            <label className="luxury-request-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
              {errors.email && <em>{errors.email}</em>}
            </label>

            <label className="luxury-request-field luxury-request-field--textarea">
              <span>Anything else we should know?</span>
              <textarea
                rows={6}
                placeholder="Share the room mood, cultural details, budget context, or anything else that should shape the consultation."
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </label>

            <p className="luxury-request-note">We respond within 12 to 24 hours.</p>
          </div>
        )}

        {currentStep.key === "summary" && (
          <div className="luxury-request-stage-body">
            <div className="luxury-request-summary">
              <div className="luxury-request-summary-copy">
                <p className="eyebrow">Summary preview</p>
                <h3>Your vision is clear enough for a strong first consultation.</h3>
                <p className="muted">
                  We will use these selections to prepare a more aligned conversation around styling scope, room impact, and the design direction that fits your event.
                </p>
              </div>
              <div className="luxury-request-summary-list">
                {summaryItems.map((item) => (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div>
                  <strong>Inspiration uploads</strong>
                  <span>{inspirationFiles.length ? `${inspirationFiles.length} image${inspirationFiles.length > 1 ? "s" : ""}` : "None uploaded"}</span>
                </div>
              </div>
            </div>
            {submitError && <p className="luxury-request-error">{submitError}</p>}
          </div>
        )}
      </div>

      <div className="luxury-request-actions">
        <Button variant="secondary" onClick={goBack} disabled={stepIndex === 0 || submitting}>
          Back
        </Button>
        {currentStep.key === "summary" ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Schedule Your Consultation"}
          </Button>
        ) : (
          <Button onClick={goNext}>Continue</Button>
        )}
      </div>
    </Card>
  );
}
