"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function PackageEditor({
  item,
  onDeleted,
}: {
  item: PackageItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
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

    setMessage("Package updated.");
    router.refresh();
  }

  async function deleteItem() {
    const confirmed = window.confirm(
      `Delete "${item.name}" from the site? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

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

    onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="card admin-package-editor">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Editing Package</p>
          <h3>{item.name}</h3>
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
          <label className="label">Package Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
        <label className="label">Package Details</label>
        <textarea
          className="textarea"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder="One feature or package detail per line"
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Sort Order</label>
          <input
            className="input"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>

        <div className="field admin-package-toggle-group">
          <label className="checkline">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span>Featured package</span>
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Visible on public site</span>
          </label>
        </div>
      </div>

      <div className="admin-package-actions">
        <button type="button" className="btn secondary" onClick={saveItem} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" className="btn" onClick={deleteItem} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Package"}
        </button>
      </div>

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function PackageManagement({ items }: { items: PackageItem[] }) {
  const router = useRouter();
  const [packages, setPackages] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [name, setName] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [summary, setSummary] = useState("");
  const [features, setFeatures] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedItem = useMemo(
    () => packages.find((item) => item.id === selectedId) ?? packages[0] ?? null,
    [packages, selectedId]
  );

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

    setMessage("Package created. Refreshing the list...");
    setName("");
    setBestFor("");
    setSummary("");
    setFeatures("");
    setFeatured(false);
    setSortOrder("");
    router.refresh();
  }

  function handleDeleted(id: string) {
    const nextPackages = packages.filter((item) => item.id !== id);
    setPackages(nextPackages);
    setSelectedId(nextPackages[0]?.id ?? "");
  }

  return (
    <div className="admin-package-shell">
      <div className="card admin-package-intro">
        <div>
          <p className="eyebrow">Package Admin</p>
          <h3>Update your public offers without touching code</h3>
        </div>
        <p className="lead">
          Yes, you can edit existing packages here, hide them from the site, or
          remove them completely.
        </p>
      </div>

      <div className="admin-package-workspace">
        <div className="admin-package-list-wrap">
          <div className="card admin-package-list">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Existing Packages</p>
                <h3>Choose one to edit</h3>
              </div>
            </div>

            {packages.length ? (
              <div className="admin-package-list-items">
                {packages.map((item) => {
                  const active = selectedItem?.id === item.id;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`admin-package-list-item${active ? " is-active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.best_for || "Package details"}</span>
                      </div>
                      <small>{item.is_active ? "Visible" : "Hidden"}</small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No packages yet. Create one below.</p>
            )}
          </div>

          <div className="card admin-package-create">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Create Package</p>
                <h3>Add a new offer</h3>
              </div>
            </div>

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
                <label className="label">Package Details</label>
                <textarea
                  className="textarea"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="One feature or package detail per line"
                />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="label">Sort Order</label>
                  <input
                    className="input"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
                <div className="field admin-package-toggle-group">
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    <span>Featured package</span>
                  </label>
                </div>
              </div>

              <button className="btn" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Package"}
              </button>
            </form>

            {message ? <p className={message.includes("created") ? "success" : "error"}>{message}</p> : null}
          </div>
        </div>

        <div className="admin-package-editor-wrap">
          {selectedItem ? (
            <PackageEditor item={selectedItem} onDeleted={handleDeleted} />
          ) : (
            <div className="card admin-package-empty">
              <h3>No package selected</h3>
              <p className="muted">
                Create your first package or choose one from the list to edit it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
