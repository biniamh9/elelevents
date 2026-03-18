"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingCatalogItem } from "@/lib/admin-pricing";
import { formatCatalogLabel } from "@/lib/admin-pricing";

function PricingCatalogEditor({
  item,
  onDeleted,
}: {
  item: PricingCatalogItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? "");
  const [variant, setVariant] = useState(item.variant ?? "");
  const [unitLabel, setUnitLabel] = useState(item.unit_label ?? "each");
  const [unitPrice, setUnitPrice] = useState(String(item.unit_price ?? 0));
  const [sortOrder, setSortOrder] = useState(
    item.sort_order !== null && item.sort_order !== undefined
      ? String(item.sort_order)
      : ""
  );
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(item.name);
    setCategory(item.category ?? "");
    setVariant(item.variant ?? "");
    setUnitLabel(item.unit_label ?? "each");
    setUnitPrice(String(item.unit_price ?? 0));
    setSortOrder(
      item.sort_order !== null && item.sort_order !== undefined
        ? String(item.sort_order)
        : ""
    );
    setNotes(item.notes ?? "");
    setIsActive(Boolean(item.is_active));
    setMessage("");
  }, [item]);

  async function saveItem() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/pricing-catalog/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: category || null,
        variant: variant || null,
        unit_label: unitLabel,
        unit_price: Number(unitPrice || 0),
        sort_order: sortOrder ? Number(sortOrder) : null,
        notes: notes || null,
        is_active: isActive,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save pricing item.");
      return;
    }

    setMessage("Pricing item updated.");
    router.refresh();
  }

  async function deleteItem() {
    const confirmed = window.confirm(
      `Delete "${formatCatalogLabel(item)}" from the pricing catalog?`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");
    const res = await fetch(`/api/admin/pricing-catalog/${item.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to delete pricing item.");
      return;
    }

    onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="card admin-package-editor">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Editing Pricing Item</p>
          <h3>{formatCatalogLabel(item)}</h3>
        </div>
        <div className="admin-package-status">
          <span className={`admin-status-pill${isActive ? " is-live" : ""}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Item Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Category</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Variant</label>
          <input className="input" value={variant} onChange={(e) => setVariant(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Unit Label</label>
          <input className="input" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Unit Price</label>
          <input className="input" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="label">Notes</label>
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <label className="checkline">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Available in the quote builder</span>
      </label>

      <div className="admin-package-actions">
        <button type="button" className="btn secondary" onClick={saveItem} disabled={saving}>
          {saving ? "Saving..." : "Save Item"}
        </button>
        <button type="button" className="btn" onClick={deleteItem} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Item"}
        </button>
      </div>

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function PricingCatalogManagement({
  items,
}: {
  items: PricingCatalogItem[];
}) {
  const router = useRouter();
  const [catalogItems, setCatalogItems] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [variant, setVariant] = useState("");
  const [unitLabel, setUnitLabel] = useState("each");
  const [unitPrice, setUnitPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedItem = useMemo(
    () => catalogItems.find((item) => item.id === selectedId) ?? catalogItems[0] ?? null,
    [catalogItems, selectedId]
  );

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const res = await fetch("/api/admin/pricing-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: category || null,
        variant: variant || null,
        unit_label: unitLabel,
        unit_price: Number(unitPrice || 0),
        sort_order: sortOrder ? Number(sortOrder) : null,
        notes: notes || null,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to create pricing item.");
      return;
    }

    setMessage("Pricing item created.");
    setName("");
    setCategory("");
    setVariant("");
    setUnitLabel("each");
    setUnitPrice("");
    setSortOrder("");
    setNotes("");
    router.refresh();
  }

  function handleDeleted(id: string) {
    const nextItems = catalogItems.filter((item) => item.id !== id);
    setCatalogItems(nextItems);
    setSelectedId(nextItems[0]?.id ?? "");
  }

  return (
    <div className="admin-package-shell">
      <div className="card admin-package-intro">
        <div>
          <p className="eyebrow">Pricing Catalog</p>
          <h3>Maintain the decor pricing list once, reuse it in every quote</h3>
        </div>
        <p className="lead">
          Add reusable decor items, variants, and unit pricing so the admin
          quote builder stays fast and consistent.
        </p>
      </div>

      <div className="admin-package-workspace">
        <div className="admin-package-list-wrap">
          <div className="card admin-package-list">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Catalog Items</p>
                <h3>Choose one to edit</h3>
              </div>
            </div>

            {catalogItems.length ? (
              <div className="admin-package-list-items">
                {catalogItems.map((item) => {
                  const active = selectedItem?.id === item.id;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`admin-package-list-item${active ? " is-active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div>
                        <strong>{formatCatalogLabel(item)}</strong>
                        <span>{item.category || "Pricing item"}</span>
                      </div>
                      <small>
                        ${Number(item.unit_price ?? 0).toLocaleString()} / {item.unit_label}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No pricing items yet. Create one below.</p>
            )}
          </div>

          <div className="card admin-package-create">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Create Pricing Item</p>
                <h3>Add a reusable decor price</h3>
              </div>
            </div>

            <form onSubmit={createItem}>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Item Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Category</label>
                  <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Variant</label>
                  <input className="input" value={variant} onChange={(e) => setVariant(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Unit Label</label>
                  <input className="input" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Unit Price</label>
                  <input className="input" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Sort Order</label>
                  <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label className="label">Notes</label>
                <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn secondary" disabled={creating}>
                {creating ? "Creating..." : "Create Item"}
              </button>
            </form>

            {message ? <p className={message.includes("created") ? "success" : "error"}>{message}</p> : null}
          </div>
        </div>

        <div className="admin-package-editor-wrap">
          {selectedItem ? (
            <PricingCatalogEditor
              key={selectedItem.id}
              item={selectedItem}
              onDeleted={handleDeleted}
            />
          ) : (
            <div className="card admin-package-empty">
              <h3>No pricing item selected</h3>
              <p className="muted">Create your first catalog item to start building reusable quotes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
