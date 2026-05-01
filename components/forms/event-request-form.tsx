"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const EVENT_TYPE_OPTIONS = ["Wedding", "Engagement", "Birthday", "Corporate", "Other"] as const;

const SERVICE_OPTIONS = [
  "Full Event Decoration",
  "Head Table / Sweetheart Table",
  "Backdrop Design",
  "Centerpieces",
  "Ceiling Draping",
  "Chair Rental",
  "Table Setup",
  "Floral Design",
  "Custom Package",
] as const;

const BUDGET_RANGE_OPTIONS = [
  "I’m still exploring",
  "Under $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000+",
  "Prefer to discuss during consultation",
] as const;

const CONSULTATION_PREFERENCE_OPTIONS = [
  "Phone Call",
  "Video Call",
  "In-Person Meeting",
  "Text First",
] as const;

type RequestFormState = {
  eventType: string;
  guestCount: string;
  eventDate: string;
  services: string[];
  budgetRange: string;
  consultationPreference: string;
  name: string;
  email: string;
  phone: string;
};

type RequestFormErrors = Partial<Record<keyof RequestFormState | "services", string>>;

const INITIAL_STATE: RequestFormState = {
  eventType: EVENT_TYPE_OPTIONS[0],
  guestCount: "",
  eventDate: "",
  services: [],
  budgetRange: "",
  consultationPreference: "",
  name: "",
  email: "",
  phone: "",
};

function splitFullName(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function buildAdditionalInfo({
  budgetRange,
  consultationPreference,
}: {
  budgetRange: string;
  consultationPreference: string;
}) {
  const lines = [
    budgetRange ? `Budget range: ${budgetRange}` : null,
    consultationPreference ? `Consultation preference: ${consultationPreference}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : null;
}

export default function EventRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<RequestFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  }

  function toggleService(service: string) {
    setForm((current) => {
      const nextServices = current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service];

      return {
        ...current,
        services: nextServices,
      };
    });
    setErrors((current) => ({
      ...current,
      services: undefined,
    }));
  }

  function validate() {
    const nextErrors: RequestFormErrors = {};
    const guestCountNumber = Number(form.guestCount);

    if (!form.eventType.trim()) {
      nextErrors.eventType = "Please choose your event type.";
    }

    if (!form.guestCount.trim()) {
      nextErrors.guestCount = "Please enter the estimated number of guests.";
    } else if (!Number.isFinite(guestCountNumber) || guestCountNumber < 1) {
      nextErrors.guestCount = "Guest count must be at least 1.";
    }

    if (!form.budgetRange.trim()) {
      nextErrors.budgetRange = "Please select a budget range.";
    }

    if (!form.consultationPreference.trim()) {
      nextErrors.consultationPreference = "Please select a consultation preference.";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    } else {
      const { firstName, lastName } = splitFullName(form.name);
      if (!firstName || !lastName) {
        nextErrors.name = "Please enter your full name.";
      }
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    const { firstName, lastName } = splitFullName(form.name);
    const normalizedEmail = form.email.trim().toLowerCase();
    const guestCount = Number(form.guestCount);

    try {
      const payload = {
        event_type: form.eventType,
        guest_count: guestCount,
        services: form.services,
        budget_range: form.budgetRange,
        consultation_preference: form.consultationPreference,
        name: form.name.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        event_date: form.eventDate || null,
        firstName,
        lastName,
        eventType: form.eventType,
        guestCount,
        budgetRange: form.budgetRange,
        consultationPreference: form.consultationPreference,
        eventDate: form.eventDate || null,
        additionalInfo: buildAdditionalInfo({
          budgetRange: form.budgetRange,
          consultationPreference: form.consultationPreference,
        }),
        inspirationNotes: null,
        venueName: null,
        venueStatus: null,
        indoorOutdoor: null,
        colorsTheme: null,
        visionBoardUrls: [],
        selectedDecorCategories: [],
        decorSelections: [],
        requestedVendorCategories: [],
        vendorRequestNotes: null,
        preferredContactMethod: form.consultationPreference,
        consultationPreferenceDate: null,
        consultationPreferenceTime: null,
        consultationVideoPlatform: null,
        referralSource: "website_request_form",
        needsDeliverySetup: false,
      };

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.inserted?.id) {
        throw new Error(data?.error || "Failed to submit your request.");
      }

      const params = new URLSearchParams({
        inquiry: data.inserted.id,
        email: normalizedEmail,
        name: form.name.trim(),
      });

      router.push(`/request/follow-up?${params.toString()}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while sending your request."
      );
      setSubmitting(false);
      return;
    }
  }

  return (
    <section className="request-flow-shell" data-reveal>
      <Card
        className="request-form-card"
        data-reveal-child
        style={{ ["--reveal-delay" as string]: "0ms" }}
      >
        <div className="request-form-header">
          <div>
            <p className="eyebrow">Availability Request</p>
            <h2>Tell us the essentials.</h2>
          </div>
          <p className="muted">
            Keep this first step simple. We only need the basics to understand your event and
            prepare the right consultation.
          </p>
        </div>

        <form className="request-form" onSubmit={handleSubmit} noValidate>
          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 1</span>
              <h3>Event Details</h3>
            </div>

            <div className="request-form-grid request-form-grid--event">
              <label className="request-field">
                <span>Event Type</span>
                <select
                  value={form.eventType}
                  onChange={(event) => updateField("eventType", event.target.value)}
                  required
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.eventType ? <small className="request-field-error">{errors.eventType}</small> : null}
              </label>

              <label className="request-field">
                <span>Number of Guests</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Estimated guest count"
                  value={form.guestCount}
                  onChange={(event) => updateField("guestCount", event.target.value)}
                  required
                />
                <small className="request-field-helper">
                  An estimate is perfectly fine — we’ll help you refine details during consultation.
                </small>
                {errors.guestCount ? (
                  <small className="request-field-error">{errors.guestCount}</small>
                ) : null}
              </label>

              <label className="request-field">
                <span>Event Date</span>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => updateField("eventDate", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 2</span>
              <h3>Services Needed</h3>
            </div>

            <div className="request-option-grid" role="group" aria-label="Services Needed">
              {SERVICE_OPTIONS.map((option) => {
                const selected = form.services.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`request-select-card${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleService(option)}
                  >
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 3</span>
              <h3>Budget Range</h3>
            </div>

            <div className="request-option-grid" role="group" aria-label="Budget Range">
              {BUDGET_RANGE_OPTIONS.map((option) => {
                const selected = form.budgetRange === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`request-select-card${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => updateField("budgetRange", option)}
                  >
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            {errors.budgetRange ? (
              <p className="request-form-error request-form-error--inline">{errors.budgetRange}</p>
            ) : null}
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 4</span>
              <h3>Consultation Preference</h3>
            </div>

            <div className="request-option-grid" role="group" aria-label="Consultation Preference">
              {CONSULTATION_PREFERENCE_OPTIONS.map((option) => {
                const selected = form.consultationPreference === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`request-select-card${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => updateField("consultationPreference", option)}
                  >
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            {errors.consultationPreference ? (
              <p className="request-form-error request-form-error--inline">
                {errors.consultationPreference}
              </p>
            ) : null}
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 5</span>
              <h3>Contact Info</h3>
            </div>

            <div className="request-form-grid request-form-grid--contact">
              <label className="request-field">
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Your full name"
                  required
                />
                {errors.name ? <small className="request-field-error">{errors.name}</small> : null}
              </label>

              <label className="request-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  required
                />
                {errors.email ? <small className="request-field-error">{errors.email}</small> : null}
              </label>

              <label className="request-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(555) 555-5555"
                  required
                />
                {errors.phone ? <small className="request-field-error">{errors.phone}</small> : null}
              </label>
            </div>
          </div>

          {error ? <p className="request-form-error">{error}</p> : null}

          <div className="request-form-actions request-form-actions--stacked">
            <div className="request-form-trust">
              <strong>After you submit, our team will review your request and contact you to design your event.</strong>
            </div>
            <div className="request-form-button-row">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Check Availability"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
