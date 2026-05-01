"use client";

import { useMemo, useState } from "react";
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
  "Less than $2,500",
  "$2,500 – $5,000",
  "$5,000 – $8,000",
  "$8,000 – $12,000",
  "Above $12,000",
] as const;

const CONSULTATION_PREFERENCE_OPTIONS = [
  "Phone Call",
  "Video Call",
  "In-Person Meeting",
  "Text First (WhatsApp / SMS)",
] as const;

const DISABLED_BUDGET_OPTIONS = new Set([
  "Less than $2,500",
  "$2,500 – $5,000",
]);

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
    budgetRange ? `Investment range: ${budgetRange}` : null,
    consultationPreference ? `Consultation preference: ${consultationPreference}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : null;
}

function InvestmentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5 13.9 8l4.9.4-3.7 3.2 1.2 4.8L12 14.1 7.7 16.4l1.2-4.8-3.7-3.2L10.1 8 12 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.3 4.5h2.5l1.2 4-1.7 1.7a15.4 15.4 0 0 0 4.5 4.5l1.7-1.7 4 1.2v2.5a1.5 1.5 0 0 1-1.7 1.5A16.3 16.3 0 0 1 5.8 6.2 1.5 1.5 0 0 1 7.3 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 7.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-9Zm12 3.2 3-2v6.6l-3-2V10.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s5-4.8 5-9a5 5 0 1 0-10 0c0 4.2 5 9 5 9Zm0-7.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6.5h12A1.5 1.5 0 0 1 19.5 8v7A1.5 1.5 0 0 1 18 16.5H10l-4 3V8A1.5 1.5 0 0 1 7.5 6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CONSULTATION_ICON_MAP = {
  "Phone Call": PhoneIcon,
  "Video Call": VideoIcon,
  "In-Person Meeting": MapPinIcon,
  "Text First (WhatsApp / SMS)": MessageIcon,
} as const;

export default function EventRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<RequestFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetMessage, setBudgetMessage] = useState<string | null>(null);

  const guestCountNumber = Number(form.guestCount);
  const isLargeGuestCount = Number.isFinite(guestCountNumber) && guestCountNumber > 300;
  const disabledBudgetOptions = useMemo(
    () => (isLargeGuestCount ? DISABLED_BUDGET_OPTIONS : new Set<string>()),
    [isLargeGuestCount]
  );

  function updateField<Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key]
  ) {
    if (key === "guestCount") {
      const nextGuestCount = Number(value);
      const nextIsLargeGuestCount = Number.isFinite(nextGuestCount) && nextGuestCount > 300;

      setForm((current) => {
        const shouldClearBudget =
          nextIsLargeGuestCount && DISABLED_BUDGET_OPTIONS.has(current.budgetRange);

        return {
          ...current,
          guestCount: value as RequestFormState["guestCount"],
          budgetRange: shouldClearBudget ? "" : current.budgetRange,
        };
      });
      setErrors((current) => ({
        ...current,
        guestCount: undefined,
        budgetRange:
          nextIsLargeGuestCount && DISABLED_BUDGET_OPTIONS.has(form.budgetRange)
            ? undefined
            : current.budgetRange,
      }));
      setBudgetMessage(
        nextIsLargeGuestCount && DISABLED_BUDGET_OPTIONS.has(form.budgetRange)
          ? "We cleared the previously selected investment range because events over 300 guests need a higher starting range."
          : null
      );
      return;
    }

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
    if (key === "budgetRange") {
      setBudgetMessage(null);
    }
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
      nextErrors.budgetRange = "Please select your investment range.";
    } else if (guestCountNumber > 300 && DISABLED_BUDGET_OPTIONS.has(form.budgetRange)) {
      nextErrors.budgetRange =
        "For events over 300 guests, please choose a higher investment range.";
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
              <h3>Investment Range</h3>
              <p className="request-section-helper">
                Every event is unique. Tell us your investment range so we can create a proposal
                tailored to your vision.
              </p>
            </div>

            <div
              className="request-option-grid request-option-grid--investment"
              role="group"
              aria-label="Investment Range"
            >
              {BUDGET_RANGE_OPTIONS.map((option) => {
                const selected = form.budgetRange === option;
                const disabled = disabledBudgetOptions.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`request-select-card request-select-card--investment${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => updateField("budgetRange", option)}
                  >
                    {selected ? <span className="request-select-card-check">✓</span> : null}
                    <span className="request-select-card-icon" aria-hidden="true">
                      <InvestmentIcon />
                    </span>
                    <strong>{option}</strong>
                    {disabled ? (
                      <small>Not recommended for 300+ guests</small>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {isLargeGuestCount ? (
              <p className="request-field-helper request-card-helper">
                For events over 300 guests, we recommend a higher investment range to support full
                decor, staffing, setup, and event complexity.
              </p>
            ) : null}
            {budgetMessage ? (
              <p className="request-field-helper request-card-helper">{budgetMessage}</p>
            ) : null}
            {errors.budgetRange ? (
              <p className="request-form-error request-form-error--inline">{errors.budgetRange}</p>
            ) : null}
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 4</span>
              <h3>Consultation Preference</h3>
            </div>

            <div
              className="request-option-grid request-option-grid--consultation"
              role="group"
              aria-label="Consultation Preference"
            >
              {CONSULTATION_PREFERENCE_OPTIONS.map((option) => {
                const selected = form.consultationPreference === option;
                const Icon = CONSULTATION_ICON_MAP[option];
                return (
                  <button
                    key={option}
                    type="button"
                    className={`request-select-card request-select-card--consultation${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => updateField("consultationPreference", option)}
                  >
                    {selected ? <span className="request-select-card-check">✓</span> : null}
                    <span className="request-select-card-icon request-select-card-icon--consultation" aria-hidden="true">
                      <Icon />
                    </span>
                    <strong>{option}</strong>
                  </button>
                );
              })}
            </div>
            <p className="request-field-helper request-card-helper">
              We’ll reach out to confirm the best time and mode that works for you.
            </p>
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
