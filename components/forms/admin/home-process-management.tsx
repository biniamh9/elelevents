"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeProcessStep } from "@/lib/home-process";

function HomeProcessRowActions({
  item,
  onView,
  onEdit,
}: {
  item: HomeProcessStep;
  onView: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);

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
          <span>Actions</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="m5 7 5 6 5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="admin-row-action-dropdown">
          <button
            type="button"
            className="admin-row-action-item"
            onClick={() => {
              onView();
              setOpen(false);
            }}
          >
            View
          </button>
          <button
            type="button"
            className="admin-row-action-item"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          >
            Edit
          </button>
        </div>
      </details>
    </div>
  );
}

function HomeProcessEditor({ item }: { item: HomeProcessStep }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [text, setText] = useState(item.text);
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(
    item.sort_order !== null && item.sort_order !== undefined
      ? String(item.sort_order)
      : ""
  );
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(item.title);
    setText(item.text);
    setImageUrl(item.image_url ?? "");
    setSortOrder(
      item.sort_order !== null && item.sort_order !== undefined
        ? String(item.sort_order)
        : ""
    );
    setIsActive(Boolean(item.is_active));
    setMessage("");
  }, [item]);

  async function saveStep() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/home-process/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        text,
        image_url: imageUrl || null,
        sort_order: sortOrder ? Number(sortOrder) : null,
        is_active: isActive,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to update flow step.");
      return;
    }

    setMessage("Homepage flow step updated.");
    router.refresh();
  }

  return (
    <div className="card admin-package-editor">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Editing Homepage Flow</p>
          <h3>{item.title}</h3>
        </div>
        <div className="admin-package-status">
          <span className={`admin-status-pill${isActive ? " is-live" : ""}`}>
            {isActive ? "Visible" : "Hidden"}
          </span>
        </div>
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="admin-gallery-preview-image"
        />
      ) : (
        <div className="card admin-testimonial-preview">
          <strong>No image selected</strong>
          <small>Add an image URL to update the preview panel on the homepage.</small>
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label className="label">Step Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="label">Supporting Text</label>
        <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Image URL</label>
        <input
          className="input"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste a gallery image URL or hosted image URL"
        />
      </div>

      <label className="checkline">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Visible on homepage flow</span>
      </label>

      <div className="admin-package-actions">
        <button type="button" className="btn secondary" onClick={saveStep} disabled={saving}>
          {saving ? "Saving..." : "Save Step"}
        </button>
      </div>

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function HomeProcessManagement({
  items,
}: {
  items: HomeProcessStep[];
}) {
  const [steps, setSteps] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    setSteps(items);
    setSelectedId((current) => {
      if (items.some((item) => item.id === current)) {
        return current;
      }
      return items[0]?.id ?? "";
    });
  }, [items]);

  const selectedItem = useMemo(
    () => steps.find((item) => item.id === selectedId) ?? steps[0] ?? null,
    [steps, selectedId]
  );

  function focusItem(id: string) {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      document
        .getElementById("home-process-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="admin-package-shell">
      <div className="card admin-package-intro">
        <div>
          <p className="eyebrow">Homepage Flow</p>
          <h3>Control the process titles, supporting text, and reveal images</h3>
        </div>
        <p className="lead">
          Edit the five homepage process steps here. Update the wording or swap the image shown in the reveal panel.
        </p>
      </div>

      <div className="card admin-table-card admin-records-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Flow Records</p>
            <h3>Manage the existing homepage steps</h3>
          </div>
        </div>

        <div className="table-wrap admin-records-table-wrap">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Title</th>
                <th>Text</th>
                <th>Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="admin-record-main">
                      <strong>{item.title}</strong>
                      <span>Sort: {item.sort_order ?? "—"}</span>
                    </div>
                  </td>
                  <td>{item.text}</td>
                  <td>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="admin-gallery-thumb"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`admin-status-pill${item.is_active ? " is-live" : ""}`}>
                      {item.is_active ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <HomeProcessRowActions
                      item={item}
                      onView={() => focusItem(item.id)}
                      onEdit={() => focusItem(item.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem ? (
        <div id="home-process-editor">
          <HomeProcessEditor item={selectedItem} />
        </div>
      ) : null}
    </div>
  );
}
