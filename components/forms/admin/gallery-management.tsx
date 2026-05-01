"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminActionRow from "@/components/admin/admin-action-row";
import AdminPortalActionMenu from "@/components/admin/admin-portal-action-menu";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSectionHeader from "@/components/admin/admin-section-header";

type GalleryItem = {
  id: string;
  title: string;
  category: string | null;
  image_url: string;
  sort_order: number | null;
  is_active: boolean | null;
  created_at?: string | null;
};

const allowedImageTypes = "image/jpeg,image/jpg,image/png,image/webp";

function GalleryRecordActions({
  item,
  onView,
  onEdit,
  onDeleted,
}: {
  item: GalleryItem;
  onView: () => void;
  onEdit: () => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${item.title}" from the gallery? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

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

    onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="admin-row-actions">
      <AdminPortalActionMenu>
        {(closeMenu) => (
          <>
          <button
            type="button"
            className="admin-row-action-item"
            onClick={() => {
              onView();
              closeMenu();
            }}
          >
            View
          </button>
          <button
            type="button"
            className="admin-row-action-item"
            onClick={() => {
              onEdit();
              closeMenu();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="admin-row-action-item admin-row-action-item--danger"
            onClick={async () => {
              closeMenu();
              await handleDelete();
            }}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          </>
        )}
      </AdminPortalActionMenu>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}

function GalleryEditor({
  item,
  onDeleted,
}: {
  item: GalleryItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category ?? "");
  const [sortOrder, setSortOrder] = useState(
    item.sort_order !== null && item.sort_order !== undefined
      ? String(item.sort_order)
      : ""
  );
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(item.title);
    setCategory(item.category ?? "");
    setSortOrder(
      item.sort_order !== null && item.sort_order !== undefined
        ? String(item.sort_order)
        : ""
    );
    setIsActive(Boolean(item.is_active));
    setMessage("");
  }, [item]);

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

    setMessage("Gallery item updated.");
    router.refresh();
  }

  async function deleteItem() {
    const confirmed = window.confirm(
      `Delete "${item.title}" from the gallery? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

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

    onDeleted(item.id);
    router.refresh();
  }

  return (
    <div className="card admin-package-editor">
      <AdminSectionHeader
        eyebrow="Editing Gallery Item"
        title={item.title}
        actions={
          <div className="admin-package-status">
            <span className={`admin-status-pill${isActive ? " is-live" : ""}`}>
              {isActive ? "Visible" : "Hidden"}
            </span>
          </div>
        }
      />

      <img
        src={item.image_url}
        alt={item.title}
        className="admin-gallery-preview-image"
      />

      <div className="form-grid">
        <div className="field">
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
      </div>

      <label className="checkline">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Visible on public gallery</span>
      </label>

      <AdminActionRow
        secondary={
          <button type="button" className="btn secondary" onClick={saveItem} disabled={saving}>
            {saving ? "Saving..." : "Save Image"}
          </button>
        }
        destructive={
          <button type="button" className="btn" onClick={deleteItem} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Image"}
          </button>
        }
      />

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function GalleryManagement({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [galleryItems, setGalleryItems] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sort_order");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category).filter(Boolean) as string[])
      ).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...galleryItems]
      .filter((item) => {
        if (statusFilter === "visible" && !item.is_active) return false;
        if (statusFilter === "hidden" && item.is_active) return false;
        if (categoryFilter !== "all" && (item.category || "") !== categoryFilter) return false;
        if (!normalizedSearch) return true;
        return `${item.title} ${item.category ?? ""}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER);
      });
  }, [categoryFilter, galleryItems, search, sortBy, statusFilter]);

  const selectedItem = useMemo(
    () =>
      filteredItems.find((item) => item.id === selectedId) ??
      galleryItems.find((item) => item.id === selectedId) ??
      filteredItems[0] ??
      galleryItems[0] ??
      null,
    [filteredItems, galleryItems, selectedId]
  );

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage("");

    if (!files.length) {
      setMessage("Choose at least one image first.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
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

    setTitle("");
    setCategory("");
    setSortOrder("");
    setFiles([]);
    setMessage(`Uploaded ${files.length} image${files.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  function handleDeleted(id: string) {
    const nextItems = galleryItems.filter((item) => item.id !== id);
    setGalleryItems(nextItems);
    setSelectedId(nextItems[0]?.id ?? "");
  }

  function focusItem(id: string) {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      document
        .getElementById("gallery-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="admin-package-shell">
      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <div className="card admin-package-intro">
          <div>
            <p className="eyebrow">Gallery management</p>
            <h3>Keep the portfolio clean, visible, and easy to curate</h3>
          </div>
          <p className="lead">
            Upload finished event images, manage their visibility, and jump straight into editing
            the selected gallery item without losing track of the full library.
          </p>
        </div>

        <aside className="card admin-section-card admin-management-sidecard">
          <AdminSectionHeader
            title="Current selection"
            description="Review the active image before editing its details."
          />
          {selectedItem ? (
            <div className="admin-media-spotlight">
              <img src={selectedItem.image_url} alt={selectedItem.title} className="admin-gallery-preview-image" />
              <div className="admin-media-spotlight-copy">
                <strong>{selectedItem.title}</strong>
                <span>{selectedItem.category || "Uncategorized"}</span>
                <small>{selectedItem.is_active ? "Visible in public gallery" : "Hidden from public gallery"}</small>
              </div>
            </div>
          ) : (
            <p className="muted">Select a gallery item from the records table to review it here.</p>
          )}
        </aside>
      </div>

      <div className="admin-package-workspace">
        <div className="admin-package-list-wrap">
          <div className="card admin-package-create">
            <AdminSectionHeader
              eyebrow="Upload images"
              title="Send new images into the gallery"
              description="Add assets once, then organize them from the records below."
            />

            <form onSubmit={uploadImage}>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Title</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="field">
                  <label className="label">Category</label>
                  <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Wedding, Melsi, Bridal Shower..." />
                </div>

                <div className="field">
                  <label className="label">Sort Order</label>
                  <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">Image Files</label>
                  <input
                    className="input"
                    type="file"
                    accept={allowedImageTypes}
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    required
                  />
                  <p className="muted" style={{ marginTop: "8px" }}>
                    JPG, PNG, or WEBP. If you choose multiple files, the same title/category/sort base is used.
                  </p>
                </div>
              </div>

              <AdminActionRow
                primary={
                  <button className="btn" type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Images"}
                  </button>
                }
              />
            </form>

            {message ? <p className={message.includes("Uploaded") ? "success" : "error"}>{message}</p> : null}
          </div>
        </div>

        <div className="admin-package-editor-wrap" id="gallery-editor">
          {selectedItem ? (
            <GalleryEditor
              key={selectedItem.id}
              item={selectedItem}
              onDeleted={handleDeleted}
            />
          ) : (
            <AdminEmptyState
              title="No gallery image selected"
              description="Choose a row from the table below to edit an existing image."
            />
          )}
        </div>
      </div>

      <div className="card admin-table-card admin-records-table-card">
        <AdminSectionHeader
          eyebrow="Gallery Records"
          title="Manage existing images"
          description="Search and filter the full library, then open any row to edit it above."
        />

        <div className="admin-filters admin-filters--records">
          <div className="field">
            <label className="label">Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or category"
            />
          </div>

          <div className="field">
            <label className="label">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
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
              <option value="sort_order">Sort order</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div className="admin-record-table-shell">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Sort Order</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="admin-gallery-thumb"
                      />
                    </td>
                    <td>
                      <div className="admin-record-main">
                        <strong>{item.title}</strong>
                        <span>{item.image_url.split("/").pop()}</span>
                      </div>
                    </td>
                    <td>{item.category || "—"}</td>
                    <td>
                      <span className={`admin-status-pill${item.is_active ? " is-live" : ""}`}>
                        {item.is_active ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td>{item.sort_order ?? "—"}</td>
                    <td>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <GalleryRecordActions
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
                  <td colSpan={7} className="admin-records-empty">
                    No gallery images match the current filters.
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
                  <strong>{item.title}</strong>
                  <span>{item.category || "Gallery image"}</span>
                </div>
                <span className={`admin-status-pill${item.is_active ? " is-live" : ""}`}>
                  {item.is_active ? "Visible" : "Hidden"}
                </span>
              </div>

              <img
                src={item.image_url}
                alt={item.title}
                className="admin-gallery-thumb admin-gallery-thumb--mobile"
              />

              <div className="admin-mobile-record-grid">
                <p>
                  <span>Sort</span>
                  {item.sort_order ?? "—"}
                </p>
                <p>
                  <span>Uploaded</span>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                </p>
              </div>

              <GalleryRecordActions
                item={item}
                onView={() => focusItem(item.id)}
                onEdit={() => focusItem(item.id)}
                onDeleted={handleDeleted}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
