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
  const [open, setOpen] = useState(false);

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

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="admin-row-actions">
      <details
        className="admin-row-action-menu"
        open={open}
        onToggle={(event) =>
          setOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary className="admin-row-action-trigger">
          Actions
          <span aria-hidden="true">▾</span>
        </summary>

        <div className="admin-row-action-dropdown">
          <Link
            href={`/admin/inquiries/${inquiryId}`}
            className="admin-row-action-item"
          >
            View
          </Link>
          <Link
            href={`/admin/inquiries/${inquiryId}#next-action`}
            className="admin-row-action-item"
          >
            Edit
          </Link>
          <Link
            href={`/admin/inquiries/${inquiryId}#quote-stage`}
            className="admin-row-action-item"
          >
            Pricing
          </Link>
          <Link
            href={`/admin/inquiries/${inquiryId}/itemized-draft`}
            className="admin-row-action-item"
          >
            Itemized Draft
          </Link>
          <button
            type="button"
            className="admin-row-action-item admin-row-action-item--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </details>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
