"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingCatalogItem } from "@/lib/admin-pricing";
import { formatCatalogLabel } from "@/lib/admin-pricing";

function PricingRecordActions({
  item,
  onView,
  onEdit,
  onDeleted,
}: {
  item: PricingCatalogItem;
  onView: () => void;
  onEdit: () => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${formatCatalogLabel(item)}" from the pricing catalog? This cannot be undone.`
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

    setOpen(false);
    onDeleted(item.id);
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("category");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [variant, setVariant] = useState("");
  const [unitLabel, setUnitLabel] = useState("each");
  const [unitPrice, setUnitPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category).filter(Boolean) as string[])
      ).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...catalogItems]
      .filter((item) => {
        if (statusFilter === "active" && !item.is_active) {
          return false;
        }
        if (statusFilter === "inactive" && item.is_active) {
          return false;
        }
        if (categoryFilter !== "all" && (item.category || "") !== categoryFilter) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        const haystack = `${item.name} ${item.category ?? ""} ${item.variant ?? ""} ${item.unit_label ?? ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortBy === "price_high") {
          return Number(b.unit_price) - Number(a.unit_price);
        }
        if (sortBy === "price_low") {
          return Number(a.unit_price) - Number(b.unit_price);
        }
        if (sortBy === "name") {
          return formatCatalogLabel(a).localeCompare(formatCatalogLabel(b));
        }
        return `${a.category ?? ""}-${a.sort_order ?? 0}-${a.name}`.localeCompare(
          `${b.category ?? ""}-${b.sort_order ?? 0}-${b.name}`
        );
      });
  }, [catalogItems, categoryFilter, search, sortBy, statusFilter]);

  const selectedItem = useMemo(
    () =>
      filteredItems.find((item) => item.id === selectedId) ??
      catalogItems.find((item) => item.id === selectedId) ??
      filteredItems[0] ??
      catalogItems[0] ??
      null,
    [catalogItems, filteredItems, selectedId]
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

  function focusItem(id: string) {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      document
        .getElementById("pricing-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="admin-package-shell">
      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <div className="card admin-package-intro">
          <div>
            <p className="eyebrow">Pricing catalog</p>
            <h3>Maintain the decor pricing list once and reuse it in every quote</h3>
          </div>
          <p className="lead">
            Keep pricing records clean, searchable, and easy to update so quote building stays
            reliable across inquiries, documents, and contracts.
          </p>
        </div>

        <aside className="card admin-section-card admin-management-sidecard">
          <div className="admin-section-title">
            <h3>Current selection</h3>
            <p className="muted">Review the active pricing item before editing its details.</p>
          </div>
          {selectedItem ? (
            <div className="admin-selection-summary">
              <strong>{formatCatalogLabel(selectedItem)}</strong>
              <span>{selectedItem.category || "Uncategorized"}</span>
              <small>
                ${Number(selectedItem.unit_price ?? 0).toLocaleString()} per {selectedItem.unit_label || "each"}
              </small>
            </div>
          ) : (
            <p className="muted">Select a pricing item from the records table to review it here.</p>
          )}
        </aside>
      </div>

      <div className="card admin-table-card admin-records-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Pricing Records</p>
            <h3>Reusable pricing items</h3>
            <p className="muted">Search and filter the catalog, then open any row to edit it below.</p>
          </div>
        </div>

        <div className="admin-filters admin-filters--records">
          <div className="field">
            <label className="label">Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Item, category, variant, or unit"
            />
          </div>

          <div className="field">
            <label className="label">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Category</label>
            <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Sort By</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="category">Category / sort order</option>
              <option value="name">Name</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="admin-record-table-shell">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Variant</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-record-main">
                        <strong>{item.name}</strong>
                        <span>{item.notes || "Reusable pricing item"}</span>
                      </div>
                    </td>
                    <td>{item.category || "—"}</td>
                    <td>{item.variant || "—"}</td>
                    <td>{item.unit_label || "each"}</td>
                    <td>${Number(item.unit_price ?? 0).toLocaleString()}</td>
                    <td>
                      <span className={`admin-status-pill${item.is_active ? " is-live" : ""}`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{item.sort_order ?? "—"}</td>
                    <td>
                      <PricingRecordActions
                        item={item}
                        onView={() => focusItem(item.id)}
                        onEdit={() => focusItem(item.id)}
                        onDeleted={handleDeleted}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="admin-records-empty">
                    No pricing items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-records">
          {filteredItems.map((item) => (
            <div key={item.id} className="admin-mobile-record">
              <div className="admin-mobile-record-head">
                <div>
                  <strong>{formatCatalogLabel(item)}</strong>
                  <span>{item.category || "Pricing item"}</span>
                </div>
                <span className={`admin-status-pill${item.is_active ? " is-live" : ""}`}>
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="admin-mobile-record-grid">
                <p>
                  <span>Unit</span>
                  {item.unit_label || "each"}
                </p>
                <p>
                  <span>Price</span>
                  ${Number(item.unit_price ?? 0).toLocaleString()}
                </p>
                <p>
                  <span>Variant</span>
                  {item.variant || "—"}
                </p>
                <p>
                  <span>Sort</span>
                  {item.sort_order ?? "—"}
                </p>
              </div>

              <PricingRecordActions
                item={item}
                onView={() => focusItem(item.id)}
                onEdit={() => focusItem(item.id)}
                onDeleted={handleDeleted}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="admin-package-workspace">
        <div className="admin-package-list-wrap">
          <div className="card admin-package-create">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Create Pricing Item</p>
                <h3>Add a reusable decor price</h3>
                <p className="muted">New items become available to the quote builder after creation.</p>
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

        <div className="admin-package-editor-wrap" id="pricing-editor">
          {selectedItem ? (
            <PricingCatalogEditor
              key={selectedItem.id}
              item={selectedItem}
              onDeleted={handleDeleted}
            />
          ) : (
            <div className="card admin-package-empty">
              <h3>No pricing item selected</h3>
              <p className="muted">Choose a row from the table or create your first pricing item below.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
