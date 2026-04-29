"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildInquiryDetailHref } from "@/lib/admin-navigation";

const EVENT_TYPE_OPTIONS = ["Wedding", "Engagement", "Birthday", "Corporate", "Other"] as const;
const GUEST_COUNT_OPTIONS = [
  { label: "0–50", value: "0-50", numericValue: 25 },
  { label: "50–100", value: "50-100", numericValue: 75 },
  { label: "100–150", value: "100-150", numericValue: 125 },
  { label: "150+", value: "150+", numericValue: 175 },
] as const;
const BUDGET_RANGE_OPTIONS = [
  "",
  "Under $3,000",
  "$3,000–$5,000",
  "$5,000–$8,000",
  "$8,000–$12,000",
  "$12,000+",
] as const;

type ManualInquiryFormState = {
  fullName: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  guestCountRange: string;
  vision: string;
  budgetRange: string;
  intakeNotes: string;
};

const INITIAL_STATE: ManualInquiryFormState = {
  fullName: "",
  phone: "",
  email: "",
  eventType: EVENT_TYPE_OPTIONS[0],
  eventDate: "",
  guestCountRange: "",
  vision: "",
  budgetRange: "",
  intakeNotes: "",
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

function getGuestCountNumericValue(range: string) {
  return GUEST_COUNT_OPTIONS.find((option) => option.value === range)?.numericValue ?? null;
}

function buildAdditionalInfo({
  budgetRange,
  guestCountRange,
  intakeNotes,
}: {
  budgetRange: string;
  guestCountRange: string;
  intakeNotes: string;
}) {
  const lines = [
    "Manual admin intake.",
    budgetRange ? `Budget range: ${budgetRange}` : null,
    guestCountRange ? `Guest count range: ${guestCountRange}` : null,
    intakeNotes.trim() ? `Admin notes: ${intakeNotes.trim()}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export default function ManualInquiryForm() {
  const router = useRouter();
  const [form, setForm] = useState<ManualInquiryFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<Key extends keyof ManualInquiryFormState>(
    key: Key,
    value: ManualInquiryFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { firstName, lastName } = splitFullName(form.fullName);
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      setSubmitting(false);
      setError("Enter the customer’s full name.");
      return;
    }

    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: normalizedEmail,
          phone: form.phone.trim(),
          eventType: form.eventType,
          eventDate: form.eventDate || null,
          guestCount: getGuestCountNumericValue(form.guestCountRange),
          services: [],
          inspirationNotes: form.vision.trim() || null,
          additionalInfo: buildAdditionalInfo({
            budgetRange: form.budgetRange,
            guestCountRange: form.guestCountRange,
            intakeNotes: form.intakeNotes,
          }),
          referralSource: "manual_admin_entry",
          preferredContactMethod: "phone",
          needsDeliverySetup: false,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data?.inquiry?.id) {
        throw new Error(data?.error || "Failed to create inquiry.");
      }

      router.push(buildInquiryDetailHref(data.inquiry.id));
      router.refresh();
    } catch (submissionError) {
      setSubmitting(false);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create inquiry."
      );
    }
  }

  return (
    <form className="admin-manual-intake-shell" onSubmit={handleSubmit}>
      <section className="card admin-document-section">
        <div className="admin-document-section-head">
          <div>
            <p className="eyebrow">Manual intake</p>
            <h3>Enter the request for the customer</h3>
            <p className="muted">
              Use this when the lead calls, texts, walks in, or sends details outside the website form.
            </p>
          </div>
        </div>

        <div className="admin-document-grid">
          <div className="field">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Phone Number</label>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Event Type</label>
            <select
              className="input"
              value={form.eventType}
              onChange={(event) => updateField("eventType", event.target.value)}
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Event Date</label>
            <input
              className="input"
              type="date"
              value={form.eventDate}
              onChange={(event) => updateField("eventDate", event.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Estimated Guest Count</label>
            <select
              className="input"
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
          </div>
          <div className="field">
            <label className="label">Budget Range</label>
            <select
              className="input"
              value={form.budgetRange}
              onChange={(event) => updateField("budgetRange", event.target.value)}
            >
              {BUDGET_RANGE_OPTIONS.map((option) => (
                <option key={option || "empty"} value={option}>
                  {option || "Not provided"}
                </option>
              ))}
            </select>
          </div>
          <div className="field field--full">
            <label className="label">Event Vision</label>
            <textarea
              className="input"
              rows={5}
              value={form.vision}
              onChange={(event) => updateField("vision", event.target.value)}
              placeholder="Share the customer’s style, colors, event direction, or anything already discussed."
            />
          </div>
          <div className="field field--full">
            <label className="label">Internal Intake Notes</label>
            <textarea
              className="input"
              rows={3}
              value={form.intakeNotes}
              onChange={(event) => updateField("intakeNotes", event.target.value)}
              placeholder="Optional notes about how the lead came in, what was said on the call, or anything that should guide follow-up."
            />
          </div>
        </div>
      </section>

      <div className="admin-document-inline-actions admin-document-inline-actions--spread">
        <div className="admin-manual-intake-note">
          <p className="muted">
            This creates a real inquiry inside the same intake, CRM, quote, contract, and handoff workflow as website submissions.
          </p>
          {error ? <p className="error">{error}</p> : null}
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Create Request"}
        </button>
      </div>
    </form>
  );
}
