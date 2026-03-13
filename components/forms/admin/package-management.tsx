"use client";

import { useState } from "react";

type PackageItem = {
  id: string;
  name: string;
  best_for: string | null;
  summary: string | null;
  features: string[] | null;
  featured: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
};

function normalizeFeatures(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function PackageRow({ item }: { item: PackageItem }) {
  const [name, setName] = useState(item.name);
  const [bestFor, setBestFor] = useState(item.best_for ?? "");
  const [summary, setSummary] = useState(item.summary ?? "");
  const [features, setFeatures] = useState((item.features ?? []).join("\n"));
  const [featured, setFeatured] = useState(Boolean(item.featured));
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [sortOrder, setSortOrder] = useState(item.sort_order ? String(item.sort_order) : "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveItem() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/packages/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        best_for: bestFor || null,
        summary: summary || null,
        features: normalizeFeatures(features),
        featured,
        is_active: isActive,
        sort_order: sortOrder ? Number(sortOrder) : null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save package.");
      return;
    }

    setMessage("Saved.");
  }

  async function deleteItem() {
    setDeleting(true);
    setMessage("");

    const res = await fetch(`/api/admin/packages/${item.id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete package.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="card">
      <div className="field">
        <label className="label">Package Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Best For</label>
        <input className="input" value={bestFor} onChange={(e) => setBestFor(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Summary</label>
        <textarea className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Features</label>
        <textarea
          className="textarea"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder="One feature per line"
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>

        <div className="field" style={{ display: "grid", gap: "12px", alignContent: "start" }}>
          <label className="checkline">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            <span>Featured package</span>
          </label>
          <label className="checkline">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Visible on public site</span>
          </label>
        </div>
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

export default function PackageManagement({ items }: { items: PackageItem[] }) {
  const [name, setName] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [summary, setSummary] = useState("");
  const [features, setFeatures] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  async function createPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const res = await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        best_for: bestFor || null,
        summary: summary || null,
        features: normalizeFeatures(features),
        featured,
        sort_order: sortOrder ? Number(sortOrder) : null,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to create package.");
      return;
    }

    window.location.reload();
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="card">
        <h3>Create Package</h3>
        <p className="muted">
          Manage public package descriptions here instead of changing source files.
        </p>

        <form onSubmit={createPackage}>
          <div className="form-grid">
            <div className="field">
              <label className="label">Package Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">Best For</label>
              <input className="input" value={bestFor} onChange={(e) => setBestFor(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Summary</label>
            <textarea className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Features</label>
            <textarea
              className="textarea"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="One feature per line"
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Sort Order</label>
              <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="field" style={{ display: "grid", alignContent: "end" }}>
              <label className="checkline">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                <span>Featured package</span>
              </label>
            </div>
          </div>

          <button className="btn" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Package"}
          </button>
        </form>

        {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
      </div>

      <div>
        <h3>Existing Packages</h3>
        <div className="package-grid">
          {items.map((item) => (
            <PackageRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
