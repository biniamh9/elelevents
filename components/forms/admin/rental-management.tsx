"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { formatMoney, formatRentalPrice, type RentalItem } from "@/lib/rentals";

function RentalRowActions({
  item,
  onArchived,
  onDeleted,
}: {
  item: RentalItem;
  onArchived: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<"" | "archive" | "delete">("");
  const [message, setMessage] = useState("");

  async function archiveItem() {
    setWorking("archive");
    setMessage("");

    const response = await fetch(`/api/admin/rentals/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    const data = await response.json();
    setWorking("");

    if (!response.ok) {
      setMessage(data.error || "Failed to archive rental item.");
      return;
    }

    setOpen(false);
    onArchived(item.id);
    router.refresh();
  }

  async function deleteItem() {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setWorking("delete");
    setMessage("");

    const response = await fetch(`/api/admin/rentals/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setWorking("");

    if (!response.ok) {
      setMessage(data.error || "Failed to delete rental item.");
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
        onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="admin-row-action-trigger">
          <span>Actions</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 7 5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>

        <div className="admin-row-action-dropdown">
          <Link href={`/admin/rentals/${item.id}`} className="admin-row-action-item">Edit</Link>
          {item.active ? (
            <button type="button" className="admin-row-action-item" disabled={working === "archive"} onClick={archiveItem}>
              {working === "archive" ? "Archiving..." : "Archive"}
            </button>
          ) : null}
          <button type="button" className="admin-row-action-item admin-row-action-item--danger" disabled={working === "delete"} onClick={deleteItem}>
            {working === "delete" ? "Deleting..." : "Delete"}
          </button>
        </div>
      </details>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}

export default function RentalManagement({
  items,
}: {
  items: RentalItem[];
}) {
  const [records, setRecords] = useState(items);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(records.map((item) => item.category).filter(Boolean) as string[])).sort(),
    [records]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((item) => {
      if (category !== "all" && item.category !== category) {
        return false;
      }

      if (status === "active" && !item.active) {
        return false;
      }

      if (status === "inactive" && item.active) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [item.name, item.slug, item.category, item.short_description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [records, search, category, status]);

  if (!records.length) {
    return (
      <AdminEmptyState
        eyebrow="Rentals"
        title="No rental items yet"
        description="Start by adding a rental item such as Chiavari chairs, candles, or focal decor so pricing and availability can be managed centrally."
        action={<Link href="/admin/rentals/new" className="btn">Create rental item</Link>}
      />
    );
  }

  return (
    <div className="card admin-table-card admin-records-table-card">
      <AdminSectionHeader
        eyebrow="Rental Inventory"
        title="Manage rental items"
        actions={<Link href="/admin/rentals/new" className="btn">New rental item</Link>}
      />

      <div className="admin-toolbar-grid">
        <div className="field">
          <label className="label">Search</label>
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chair, candle, backdrop" />
        </div>
        <div className="field">
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Archived</option>
          </select>
        </div>
      </div>

      <div className="admin-record-table-shell">
        <table className="admin-records-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Base price</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="admin-table-primary">
                    {item.featured_image_url ? (
                      <img src={item.featured_image_url} alt={item.name} className="rental-admin-thumb" />
                    ) : null}
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.short_description || item.slug}</span>
                    </div>
                  </div>
                </td>
                <td>{item.category || "Uncategorized"}</td>
                <td>{formatRentalPrice(item.base_rental_price, item.price_type)}</td>
                <td>
                  <strong>{item.available_quantity}</strong>
                  <span>Min {item.minimum_order_quantity}</span>
                </td>
                <td>{item.active ? "Active" : "Archived"}</td>
                <td>{item.featured ? "Featured" : "Standard"}</td>
                <td>
                  <RentalRowActions
                    item={item}
                    onArchived={(id) =>
                      setRecords((current) =>
                        current.map((entry) => (entry.id === id ? { ...entry, active: false } : entry))
                      )
                    }
                    onDeleted={(id) =>
                      setRecords((current) => current.filter((entry) => entry.id !== id))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredItems.length ? (
        <p className="muted">No rental items match the current filters.</p>
      ) : (
        <p className="muted">
          {filteredItems.length} items shown. Active inventory value starts at{" "}
          {formatMoney(
            filteredItems.reduce((sum, item) => sum + item.base_rental_price, 0)
          )}
          .
        </p>
      )}
    </div>
  );
}
