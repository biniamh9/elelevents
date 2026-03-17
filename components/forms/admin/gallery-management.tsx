"use client";

import { useState } from "react";

type GalleryItem = {
  id: string;
  title: string;
  category: string | null;
  image_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

const allowedImageTypes = "image/jpeg,image/jpg,image/png,image/webp";

function GalleryRow({ item }: { item: GalleryItem }) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category ?? "");
  const [sortOrder, setSortOrder] = useState(item.sort_order ? String(item.sort_order) : "");
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveItem() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category: category || null,
        sort_order: sortOrder ? Number(sortOrder) : null,
        is_active: isActive,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save image details.");
      return;
    }

    setMessage("Saved.");
  }

  async function deleteItem() {
    setDeleting(true);
    setMessage("");

    const res = await fetch(`/api/admin/gallery/${item.id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete image.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="card">
      <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "240px", objectFit: "cover", borderRadius: "18px" }} />

      <div className="field" style={{ marginTop: "16px" }}>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Category</label>
        <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Sort Order</label>
        <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </div>

      <div className="field">
        <label className="checkline">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Visible on public gallery</span>
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" className="btn secondary" onClick={saveItem} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" className="btn" onClick={deleteItem} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}

export default function GalleryManagement({ items }: { items: GalleryItem[] }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage("");

    if (!file) {
      setMessage("Choose an image first.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);
    formData.append("sort_order", sortOrder);

    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to upload image.");
      return;
    }

    window.location.reload();
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="card">
        <h3>Upload Gallery Image</h3>
        <p className="muted">
          Upload finished event images here. This replaces hardcoded gallery URLs.
        </p>

        <form onSubmit={uploadImage}>
          <div className="form-grid">
            <div className="field">
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">Category</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Wedding, Melsi, Birthday..." />
            </div>

            <div className="field">
              <label className="label">Sort Order</label>
              <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Image File</label>
              <input
                className="input"
                type="file"
                accept={allowedImageTypes}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          </div>

          <button className="btn" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </form>

        {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
      </div>

      <div>
        <h3>Existing Gallery Images</h3>
        <div className="gallery-grid">
          {items.map((item) => (
            <GalleryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
