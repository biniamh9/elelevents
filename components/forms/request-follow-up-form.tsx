"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const STYLE_OPTIONS = [
  "Soft Glam",
  "Classic",
  "Modern",
  "Cultural",
  "Romantic",
  "Editorial",
  "Minimal",
] as const;

type RequestFollowUpFormProps = {
  inquiryId: string | null;
  inquiryEmail: string | null;
  customerName: string | null;
};

export default function RequestFollowUpForm({
  inquiryId,
  inquiryEmail,
  customerName,
}: RequestFollowUpFormProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [linkValue, setLinkValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileSummary = useMemo(
    () => files.map((file) => file.name),
    [files]
  );

  function toggleStyle(style: string) {
    setSelectedStyles((current) =>
      current.includes(style) ? current.filter((value) => value !== style) : [...current, style]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!inquiryId || !inquiryEmail) {
      setError("We could not find the original request. Please submit the availability form again.");
      return;
    }

    setSubmitting(true);

    try {
      let uploadedUrls: string[] = [];

      if (files.length) {
        const uploadPayload = new FormData();
        files.forEach((file) => uploadPayload.append("files", file));

        const uploadResponse = await fetch("/api/inquiries/vision-board", {
          method: "POST",
          body: uploadPayload,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData?.error || "Failed to upload your inspiration images.");
        }

        uploadedUrls = Array.isArray(uploadData?.urls) ? uploadData.urls : [];
      }

      const response = await fetch(`/api/inquiries/${inquiryId}/follow-up`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inquiryEmail,
          inspirationLinks: linkValue
            .split(/\n|,/)
            .map((value) => value.trim())
            .filter(Boolean),
          selectedStyles,
          uploadedUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save your follow-up details.");
      }

      setSuccess(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while saving your follow-up details."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="request-flow-shell" data-reveal>
        <Card className="request-follow-up-card request-follow-up-card--success" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Follow-up saved</p>
          <h2>Thank you. We have your inspiration details.</h2>
          <p className="muted">
            We will review your request and respond within 12–24 hours. If you need to add more
            inspiration later, reply to our confirmation email.
          </p>
          <div className="request-form-actions request-form-actions--stacked">
            <Button href="/portfolio" variant="secondary" arrow>
              Explore Our Work
            </Button>
            <Link href="/" className="request-inline-link">
              Return home
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="request-flow-shell" data-reveal>
      <Card className="request-follow-up-card" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
        <div className="request-form-header">
          <div>
            <p className="eyebrow">Follow-up Details</p>
            <h2>Let’s Bring Your Vision to Life</h2>
          </div>
          <p className="muted">
            {customerName
              ? `Upload inspiration for ${customerName} or share reference links so we can understand the tone and details more clearly.`
              : "Upload inspiration images or share links to help us understand your vision better."}
          </p>
        </div>

        <form className="request-form" onSubmit={handleSubmit}>
          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Optional</span>
              <h3>Inspiration Images</h3>
            </div>
            <label className="request-upload-field">
              <span>Upload images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
              />
              <small>Upload up to 5 inspiration images.</small>
            </label>
            {fileSummary.length ? (
              <div className="request-upload-list">
                {fileSummary.map((fileName) => (
                  <span key={fileName}>{fileName}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Optional</span>
              <h3>Pinterest or Instagram Links</h3>
            </div>
            <label className="request-field request-field--full">
              <span>Paste links</span>
              <textarea
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="Paste Pinterest or Instagram links separated by commas or new lines."
                rows={4}
              />
            </label>
          </div>

          <div className="request-form-section">
            <div className="request-form-section-copy">
              <span>Optional</span>
              <h3>Style Direction</h3>
            </div>
            <div className="request-chip-grid">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`request-style-chip ${selectedStyles.includes(style) ? "is-selected" : ""}`}
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="request-follow-up-note">
            <p>Upload inspiration images or share links to help us understand your vision better.</p>
            <strong>We will review your request and respond within 12–24 hours.</strong>
          </div>

          {error ? <p className="request-form-error">{error}</p> : null}

          <div className="request-form-actions">
            <div className="request-form-trust">
              <strong>Optional but useful.</strong>
              <span>You can skip this and still receive a response from our team.</span>
            </div>
            <div className="request-form-button-row">
              <Button href="/" variant="secondary">
                Skip for now
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Inspiration"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
