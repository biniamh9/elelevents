"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InquiryRecordActions({
  inquiryId,
}: {
  inquiryId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this inquiry record? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete inquiry.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="admin-row-actions">
      <Link href={`/admin/inquiries/${inquiryId}`} className="admin-row-action-link">
        View
      </Link>
      <Link
        href={`/admin/inquiries/${inquiryId}#next-action`}
        className="admin-row-action-link"
      >
        Edit
      </Link>
      <Link
        href={`/admin/inquiries/${inquiryId}#quote-stage`}
        className="admin-row-action-link"
      >
        Pricing
      </Link>
      <Link
        href={`/admin/inquiries/${inquiryId}/itemized-draft`}
        className="admin-row-action-link"
      >
        Itemized Draft
      </Link>
      <button
        type="button"
        className="admin-row-action-link admin-row-action-link--danger"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
