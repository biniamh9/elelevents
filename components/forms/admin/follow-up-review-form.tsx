"use client";

import { useState } from "react";

export default function FollowUpReviewForm({
  inquiryId,
  isReviewed,
  reviewedAt,
}: {
  inquiryId: string;
  isReviewed: boolean;
  reviewedAt: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleMarkReviewed() {
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/inquiries/${inquiryId}/follow-up-review`, {
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to mark follow-up as reviewed.");
      setSaving(false);
      return;
    }

    setMessage("Marked reviewed. Refresh to update list and overview counts.");
    setSaving(false);
  }

  return (
    <div className="admin-follow-up-review-actions">
      <div className="admin-follow-up-review-copy">
        <strong>{isReviewed ? "Follow-up reviewed" : "Follow-up review pending"}</strong>
        <span>
          {reviewedAt
            ? `Reviewed ${new Date(reviewedAt).toLocaleString()}`
            : "Mark this once the added inspiration has been reviewed and triaged."}
        </span>
      </div>
      <button type="button" className="btn secondary" onClick={handleMarkReviewed} disabled={saving || isReviewed}>
        {isReviewed ? "Reviewed" : saving ? "Saving..." : "Mark Reviewed"}
      </button>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
