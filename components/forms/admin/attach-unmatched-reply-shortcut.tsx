"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AttachUnmatchedReplyShortcut({
  inquiryId,
  replyId,
}: {
  inquiryId: string;
  replyId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAttach() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/unmatched-email-replies/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach",
          inquiryId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to attach unmatched reply.");
      }

      setMessage("Reply attached. Refreshing lead timeline.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to attach unmatched reply."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-follow-up-review-actions">
      <div className="admin-follow-up-review-copy">
        <strong>Attach directly to this lead</strong>
        <span>
          Use this only because there is exactly one strong unmatched-reply candidate for this opportunity.
        </span>
      </div>
      <button
        type="button"
        className="btn"
        onClick={handleAttach}
        disabled={saving}
      >
        {saving ? "Attaching..." : "Attach to this lead"}
      </button>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
