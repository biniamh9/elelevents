"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import type { GalleryItem } from "@/lib/gallery";
import type { SiteSocialLinks } from "@/lib/social-links";
import type { PublicVendorRecommendation } from "@/lib/vendors";

const EVENT_TYPE_OPTIONS = ["Wedding", "Engagement", "Birthday", "Corporate", "Other"] as const;

const GUEST_COUNT_OPTIONS = [
  { label: "0–50", value: "0-50", numericValue: 25 },
  { label: "50–100", value: "50-100", numericValue: 75 },
  { label: "100–150", value: "100-150", numericValue: 125 },
  { label: "150+", value: "150+", numericValue: 175 },
] as const;

const BUDGET_RANGE_OPTIONS = [
  "Under $3,000",
  "$3,000–$5,000",
  "$5,000–$8,000",
  "$8,000–$12,000",
  "$12,000+",
] as const;

type EventRequestFormProps = {
  vendors?: PublicVendorRecommendation[];
  portfolioItems?: GalleryItem[];
  socialLinks?: SiteSocialLinks;
  initialInquiryNote?: string;
  initialServices?: string[];
  rentalInquiryMode?: "single" | "shortlist" | null;
};

type RequestFormState = {
  fullName: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  guestCountRange: string;
  vision: string;
  budgetRange: string;
};

const INITIAL_STATE: RequestFormState = {
  fullName: "",
  phone: "",
  email: "",
  eventType: EVENT_TYPE_OPTIONS[0],
  eventDate: "",
  guestCountRange: "",
  vision: "",
  budgetRange: "",
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
  guestCountRange,
  initialInquiryNote,
}: {
  budgetRange: string;
  guestCountRange: string;
  initialInquiryNote?: string;
}) {
  const notes = [
    budgetRange ? `Budget range: ${budgetRange}` : null,
    guestCountRange ? `Guest count range: ${guestCountRange}` : null,
    initialInquiryNote ?? null,
  ].filter(Boolean);

  return notes.length ? notes.join("\n") : null;
}

function getGuestCountNumericValue(range: string) {
  return GUEST_COUNT_OPTIONS.find((option) => option.value === range)?.numericValue ?? null;
}

export default function EventRequestForm({
  initialInquiryNote,
  initialServices,
}: EventRequestFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RequestFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const helperNote = useMemo(
    () =>
      initialInquiryNote
        ? "We captured your selected service context. Use the note box only for the vision you want us to understand first."
        : "Keep it simple. We only need enough to confirm availability and understand the direction of your event.",
    [initialInquiryNote]
  );

  function updateField<Key extends keyof RequestFormState>(key: Key, value: RequestFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { firstName, lastName } = splitFullName(form.fullName);
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      setSubmitting(false);
      setError("Please enter your full name.");
      return;
    }

    try {
      const payload = {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: form.phone.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate || null,
        guestCount: getGuestCountNumericValue(form.guestCountRange),
        services: initialServices ?? [],
        inspirationNotes: form.vision.trim(),
        additionalInfo: buildAdditionalInfo({
          budgetRange: form.budgetRange,
          guestCountRange: form.guestCountRange,
          initialInquiryNote,
        }),
        venueName: null,
        venueStatus: null,
        indoorOutdoor: null,
        colorsTheme: null,
        visionBoardUrls: [],
        selectedDecorCategories: [],
        decorSelections: [],
        requestedVendorCategories: [],
        vendorRequestNotes: null,
        preferredContactMethod: "phone",
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
        name: form.fullName.trim(),
      });

      router.push(`/request/follow-up?${params.toString()}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while sending your request."
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="request-flow-shell" data-reveal>
      <Card className="request-form-card" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
        <div className="request-form-header">
          <div>
            <p className="eyebrow">Availability Request</p>
            <h2>Start with the essentials.</h2>
          </div>
          <p className="muted">{helperNote}</p>
        </div>

        <form className="request-form" onSubmit={handleSubmit}>
          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 1</span>
              <h3>Contact Information</h3>
            </div>
            <div className="request-form-grid request-form-grid--three">
              <label className="request-field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>
              <label className="request-field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(555) 555-5555"
                  required
                />
              </label>
              <label className="request-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 2</span>
              <h3>Event Details</h3>
            </div>
            <div className="request-form-grid request-form-grid--three">
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
              </label>

              <label className="request-field">
                <span>Event Date</span>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => updateField("eventDate", event.target.value)}
                />
              </label>

              <label className="request-field">
                <span>Estimated Guest Count</span>
                <select
                  value={form.guestCountRange}
                  onChange={(event) => updateField("guestCountRange", event.target.value)}
                >
                  <option value="">Select a range</option>
                  {GUEST_COUNT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 3</span>
              <h3>Vision</h3>
            </div>
            <label className="request-field request-field--full">
              <span>Tell us about your event vision</span>
              <textarea
                value={form.vision}
                onChange={(event) => updateField("vision", event.target.value)}
                placeholder="Share your ideas, style, colors, or anything you have in mind…"
                rows={6}
              />
            </label>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Section 4</span>
              <h3>Optional</h3>
            </div>
            <div className="request-form-grid request-form-grid--two">
              <label className="request-field">
                <span>Budget Range</span>
                <select
                  value={form.budgetRange}
                  onChange={(event) => updateField("budgetRange", event.target.value)}
                >
                  <option value="">Select a range</option>
                  {BUDGET_RANGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="request-form-side-note">
                <p className="eyebrow">What happens next</p>
                <p>
                  Once you send this, we take you to a follow-up page where you can upload inspiration
                  images or share Pinterest and Instagram references.
                </p>
              </div>
            </div>
          </div>

          {error ? <p className="request-form-error">{error}</p> : null}

          <div className="request-form-actions">
            <div className="request-form-trust">
              <strong>Simple first step.</strong>
              <span>We only ask for what we need to confirm fit and availability.</span>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Check Availability"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
