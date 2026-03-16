"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TestimonialItem } from "@/lib/testimonials";

function stars(rating: number | null) {
  return "★".repeat(rating ?? 5);
}

function TestimonialEditor({
  item,
  onDeleted,
}: {
  item: TestimonialItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [reviewerName, setReviewerName] = useState(item.reviewer_name);
  const [sourceLabel, setSourceLabel] = useState(item.source_label ?? "Google review");
  const [rating, setRating] = useState(String(item.rating ?? 5));
  const [eventType, setEventType] = useState(item.event_type ?? "");
  const [highlight, setHighlight] = useState(item.highlight ?? "");
  const [quote, setQuote] = useState(item.quote);
  const [featured, setFeatured] = useState(Boolean(item.is_featured));
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [sortOrder, setSortOrder] = useState(item.sort_order ? String(item.sort_order) : "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveItem() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewer_name: reviewerName,
        source_label: sourceLabel || null,
        rating: Number(rating) || 5,
        event_type: eventType || null,
        highlight: highlight || null,
        quote,
        is_featured: featured,
        is_active: isActive,
        sort_order: sortOrder ? Number(sortOrder) : null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save testimonial.");
      return;
    }

    setMessage("Testimonial updated.");
    router.refresh();
  }

  async function deleteItem() {
    const confirmed = window.confirm(
      `Delete "${item.reviewer_name}" from testimonials? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete testimonial.");
      return;
    }

    onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="card admin-package-editor">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Editing Testimonial</p>
          <h3>{item.reviewer_name}</h3>
        </div>
        <div className="admin-package-status">
          <span className={`admin-status-pill${isActive ? " is-live" : ""}`}>
            {isActive ? "Visible" : "Hidden"}
          </span>
          {featured ? <span className="admin-status-pill">Featured</span> : null}
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Reviewer Name</label>
          <input className="input" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
        </div>

        <div className="field">
          <label className="label">Source Label</label>
          <input className="input" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Rating</label>
          <input className="input" type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Event Type</label>
          <input className="input" value={eventType} onChange={(e) => setEventType(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="label">Homepage Highlight</label>
        <textarea className="textarea" value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="Short homepage version" />
      </div>

      <div className="field">
        <label className="label">Full Review</label>
        <textarea className="textarea" value={quote} onChange={(e) => setQuote(e.target.value)} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="field admin-package-toggle-group">
          <label className="checkline">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            <span>Featured on homepage</span>
          </label>
          <label className="checkline">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Visible on public site</span>
          </label>
        </div>
      </div>

      <div className="admin-testimonial-preview">
        <span>{stars(Number(rating) || 5)}</span>
        <strong>{reviewerName}</strong>
        <small>{sourceLabel || "Google review"}</small>
      </div>

      <div className="admin-package-actions">
        <button type="button" className="btn secondary" onClick={saveItem} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" className="btn" onClick={deleteItem} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Testimonial"}
        </button>
      </div>

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function TestimonialManagement({ items }: { items: TestimonialItem[] }) {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [reviewerName, setReviewerName] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Google review");
  const [rating, setRating] = useState("5");
  const [eventType, setEventType] = useState("");
  const [highlight, setHighlight] = useState("");
  const [quote, setQuote] = useState("");
  const [featured, setFeatured] = useState(true);
  const [sortOrder, setSortOrder] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedItem = useMemo(
    () => testimonials.find((item) => item.id === selectedId) ?? testimonials[0] ?? null,
    [testimonials, selectedId]
  );

  async function createTestimonial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewer_name: reviewerName,
        source_label: sourceLabel || null,
        rating: Number(rating) || 5,
        event_type: eventType || null,
        highlight: highlight || null,
        quote,
        is_featured: featured,
        sort_order: sortOrder ? Number(sortOrder) : null,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to create testimonial.");
      return;
    }

    setMessage("Testimonial created. Refreshing the list...");
    setReviewerName("");
    setSourceLabel("Google review");
    setRating("5");
    setEventType("");
    setHighlight("");
    setQuote("");
    setFeatured(true);
    setSortOrder("");
    router.refresh();
  }

  function handleDeleted(id: string) {
    const nextItems = testimonials.filter((item) => item.id !== id);
    setTestimonials(nextItems);
    setSelectedId(nextItems[0]?.id ?? "");
  }

  return (
    <div className="admin-package-shell">
      <div className="card admin-package-intro">
        <div>
          <p className="eyebrow">Testimonials</p>
          <h3>Curate the strongest proof from Google reviews</h3>
        </div>
        <p className="lead">
          Keep the homepage social proof short, specific, and believable. Store the
          full review, then use a tighter highlight for the homepage.
        </p>
      </div>

      <div className="admin-package-workspace">
        <div className="admin-package-list-wrap">
          <div className="card admin-package-list">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Existing Testimonials</p>
                <h3>Choose one to edit</h3>
              </div>
            </div>

            {testimonials.length ? (
              <div className="admin-package-list-items">
                {testimonials.map((item) => {
                  const active = selectedItem?.id === item.id;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`admin-package-list-item${active ? " is-active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div>
                        <strong>{item.reviewer_name}</strong>
                        <span>{item.highlight || item.quote.slice(0, 72)}</span>
                      </div>
                      <small>{item.is_active ? "Visible" : "Hidden"}</small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No testimonials yet. Add your first one below.</p>
            )}
          </div>

          <div className="card admin-package-create">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Add Review</p>
                <h3>Create a testimonial card</h3>
              </div>
            </div>

            <form onSubmit={createTestimonial}>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Reviewer Name</label>
                  <input className="input" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
                </div>

                <div className="field">
                  <label className="label">Source Label</label>
                  <input className="input" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="label">Rating</label>
                  <input className="input" type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Event Type</label>
                  <input className="input" value={eventType} onChange={(e) => setEventType(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label className="label">Homepage Highlight</label>
                <textarea className="textarea" value={highlight} onChange={(e) => setHighlight(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">Full Review</label>
                <textarea className="textarea" value={quote} onChange={(e) => setQuote(e.target.value)} required />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="label">Sort Order</label>
                  <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
                <div className="field admin-package-toggle-group">
                  <label className="checkline">
                    <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                    <span>Featured on homepage</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn" disabled={creating}>
                {creating ? "Creating..." : "Create Testimonial"}
              </button>
            </form>

            {message ? <p className={message.includes("created") ? "success" : "error"}>{message}</p> : null}
          </div>
        </div>

        <div className="admin-package-editor-wrap">
          {selectedItem ? (
            <TestimonialEditor item={selectedItem} onDeleted={handleDeleted} />
          ) : (
            <div className="card admin-package-empty">
              <p className="eyebrow">No testimonial selected</p>
              <h3>Create or choose a review to manage it</h3>
              <p className="muted">
                This keeps your homepage testimonials controlled instead of hardcoded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
