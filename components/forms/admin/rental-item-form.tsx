"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminActionRow from "@/components/admin/admin-action-row";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import RentalDepositTracking from "@/components/forms/admin/rental-deposit-tracking";
import RentalQuotePreview from "@/components/forms/admin/rental-quote-preview";
import {
  slugifyRentalName,
  type RentalDepositRecord,
  type RentalDepositType,
  type RentalItem,
  type RentalItemImage,
  type RentalPriceType,
} from "@/lib/rentals";

function FilePreview({
  src,
  alt,
  onRemove,
}: {
  src: string;
  alt: string;
  onRemove?: () => void;
}) {
  return (
    <div className="rental-image-preview">
      <img src={src} alt={alt} />
      {onRemove ? (
        <button type="button" className="btn secondary" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

export default function RentalItemForm({
  item,
  depositRecords = [],
}: {
  item?: RentalItem | null;
  depositRecords?: RentalDepositRecord[];
}) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(item?.slug));
  const [category, setCategory] = useState(item?.category ?? "");
  const [shortDescription, setShortDescription] = useState(item?.short_description ?? "");
  const [fullDescription, setFullDescription] = useState(item?.full_description ?? "");
  const [baseRentalPrice, setBaseRentalPrice] = useState(String(item?.base_rental_price ?? 0));
  const [priceType, setPriceType] = useState<RentalPriceType>(item?.price_type ?? "per_item");
  const [availableQuantity, setAvailableQuantity] = useState(String(item?.available_quantity ?? 0));
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(String(item?.minimum_order_quantity ?? 1));
  const [deliveryAvailable, setDeliveryAvailable] = useState(item?.delivery_available ?? true);
  const [setupAvailable, setSetupAvailable] = useState(item?.setup_available ?? true);
  const [breakdownAvailable, setBreakdownAvailable] = useState(item?.breakdown_available ?? true);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(String(item?.default_delivery_fee ?? 0));
  const [defaultSetupFee, setDefaultSetupFee] = useState(String(item?.default_setup_fee ?? 0));
  const [defaultBreakdownFee, setDefaultBreakdownFee] = useState(String(item?.default_breakdown_fee ?? 0));
  const [depositRequired, setDepositRequired] = useState(item?.deposit_required ?? false);
  const [depositType, setDepositType] = useState<RentalDepositType>(item?.deposit_type ?? "flat");
  const [depositAmount, setDepositAmount] = useState(String(item?.deposit_amount ?? 0));
  const [replacementCost, setReplacementCost] = useState(String(item?.replacement_cost ?? 0));
  const [depositTerms, setDepositTerms] = useState(item?.deposit_terms ?? "");
  const [itemDamageNotes, setItemDamageNotes] = useState(item?.damage_notes ?? "");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [active, setActive] = useState(item?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(item?.sort_order ?? 0));
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [removeFeaturedImage, setRemoveFeaturedImage] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<RentalItemImage[]>(item?.images ?? []);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const featuredImagePreview = useMemo(() => {
    if (featuredImageFile) {
      return URL.createObjectURL(featuredImageFile);
    }

    if (!removeFeaturedImage) {
      return item?.featured_image_url ?? null;
    }

    return null;
  }, [featuredImageFile, item?.featured_image_url, removeFeaturedImage]);

  const newGalleryPreviews = useMemo(
    () => galleryFiles.map((file) => ({ key: `${file.name}-${file.size}`, src: URL.createObjectURL(file) })),
    [galleryFiles]
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugifyRentalName(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("category", category);
    formData.set("short_description", shortDescription);
    formData.set("full_description", fullDescription);
    formData.set("base_rental_price", baseRentalPrice);
    formData.set("price_type", priceType);
    formData.set("available_quantity", availableQuantity);
    formData.set("minimum_order_quantity", minimumOrderQuantity);
    formData.set("delivery_available", String(deliveryAvailable));
    formData.set("setup_available", String(setupAvailable));
    formData.set("breakdown_available", String(breakdownAvailable));
    formData.set("default_delivery_fee", defaultDeliveryFee);
    formData.set("default_setup_fee", defaultSetupFee);
    formData.set("default_breakdown_fee", defaultBreakdownFee);
    formData.set("deposit_required", String(depositRequired));
    formData.set("deposit_type", depositType);
    formData.set("deposit_amount", depositAmount);
    formData.set("replacement_cost", replacementCost);
    formData.set("deposit_terms", depositTerms);
    formData.set("damage_notes", itemDamageNotes);
    formData.set("featured", String(featured));
    formData.set("active", String(active));
    formData.set("sort_order", sortOrder);
    formData.set("remove_featured_image", String(removeFeaturedImage));
    formData.set(
      "retained_gallery_ids",
      JSON.stringify(existingGalleryImages.map((image) => image.id))
    );

    if (featuredImageFile) {
      formData.set("featured_image", featuredImageFile);
    }

    for (const file of galleryFiles) {
      formData.append("gallery_images", file);
    }

    const endpoint = item ? `/api/admin/rentals/${item.id}` : "/api/admin/rentals";
    const method = item ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      body: formData,
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to save rental item.");
      return;
    }

    router.push(item ? `/admin/rentals/${item.id}` : "/admin/rentals");
    router.refresh();
  }

  async function handleDelete() {
    if (!item) {
      return;
    }

    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const response = await fetch(`/api/admin/rentals/${item.id}`, { method: "DELETE" });
    const data = await response.json();
    setDeleting(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to delete rental item.");
      return;
    }

    router.push("/admin/rentals");
    router.refresh();
  }

  return (
    <form className="rental-editor-shell" onSubmit={handleSubmit}>
      <div className="rental-editor-main">
        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Basic Details" title="Rental item details" />
          <div className="form-grid">
            <div className="field">
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(event) => handleNameChange(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Slug</label>
              <input
                className="input"
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(slugifyRentalName(event.target.value));
                }}
              />
            </div>
            <div className="field">
              <label className="label">Category</label>
              <input className="input" value={category} onChange={(event) => setCategory(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Sort order</label>
              <input className="input" type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Short description</label>
            <textarea className="textarea" value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} />
          </div>

          <div className="field">
            <label className="label">Full description</label>
            <textarea className="textarea" rows={6} value={fullDescription} onChange={(event) => setFullDescription(event.target.value)} />
          </div>
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Images" title="Featured image and gallery" />
          <div className="form-grid">
            <div className="field">
              <label className="label">Featured image</label>
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(event) => {
                  setFeaturedImageFile(event.target.files?.[0] ?? null);
                  setRemoveFeaturedImage(false);
                }}
              />
            </div>
            <div className="field">
              <label className="label">Gallery images</label>
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={(event) => setGalleryFiles(Array.from(event.target.files ?? []))}
              />
            </div>
          </div>

          {featuredImagePreview ? (
            <div className="rental-image-preview-grid">
              <FilePreview
                src={featuredImagePreview}
                alt={name || "Featured rental image"}
                onRemove={() => {
                  setFeaturedImageFile(null);
                  setRemoveFeaturedImage(true);
                }}
              />
            </div>
          ) : null}

          {existingGalleryImages.length ? (
            <>
              <p className="eyebrow">Existing gallery</p>
              <div className="rental-image-preview-grid">
                {existingGalleryImages.map((image) => (
                  <FilePreview
                    key={image.id}
                    src={image.image_url}
                    alt={name || "Rental gallery image"}
                    onRemove={() =>
                      setExistingGalleryImages((current) =>
                        current.filter((entry) => entry.id !== image.id)
                      )
                    }
                  />
                ))}
              </div>
            </>
          ) : null}

          {newGalleryPreviews.length ? (
            <>
              <p className="eyebrow">New gallery uploads</p>
              <div className="rental-image-preview-grid">
                {newGalleryPreviews.map((preview, index) => (
                  <FilePreview
                    key={preview.key}
                    src={preview.src}
                    alt={`New rental gallery image ${index + 1}`}
                    onRemove={() =>
                      setGalleryFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
                    }
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Pricing" title="Rental pricing model" />
          <div className="form-grid">
            <div className="field">
              <label className="label">Base rental price</label>
              <input className="input" type="number" min="0" step="0.01" value={baseRentalPrice} onChange={(event) => setBaseRentalPrice(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Price type</label>
              <select className="input" value={priceType} onChange={(event) => setPriceType(event.target.value as RentalPriceType)}>
                <option value="per_item">Per item</option>
                <option value="per_set">Per set</option>
                <option value="flat_rate">Flat rate</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Availability" title="Quantity and service readiness" />
          <div className="form-grid">
            <div className="field">
              <label className="label">Available quantity</label>
              <input className="input" type="number" min="0" value={availableQuantity} onChange={(event) => setAvailableQuantity(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Minimum order quantity</label>
              <input className="input" type="number" min="1" value={minimumOrderQuantity} onChange={(event) => setMinimumOrderQuantity(event.target.value)} />
            </div>
          </div>

          <div className="rental-check-grid">
            <label className="checkline">
              <input type="checkbox" checked={deliveryAvailable} onChange={(event) => setDeliveryAvailable(event.target.checked)} />
              <span>Delivery available</span>
            </label>
            <label className="checkline">
              <input type="checkbox" checked={setupAvailable} onChange={(event) => setSetupAvailable(event.target.checked)} />
              <span>Setup available</span>
            </label>
            <label className="checkline">
              <input type="checkbox" checked={breakdownAvailable} onChange={(event) => setBreakdownAvailable(event.target.checked)} />
              <span>Breakdown available</span>
            </label>
          </div>
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Service Fees" title="Default logistics fees" />
          <div className="form-grid">
            <div className="field">
              <label className="label">Default delivery fee</label>
              <input className="input" type="number" min="0" step="0.01" value={defaultDeliveryFee} onChange={(event) => setDefaultDeliveryFee(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Default setup fee</label>
              <input className="input" type="number" min="0" step="0.01" value={defaultSetupFee} onChange={(event) => setDefaultSetupFee(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Default breakdown fee</label>
              <input className="input" type="number" min="0" step="0.01" value={defaultBreakdownFee} onChange={(event) => setDefaultBreakdownFee(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader
            eyebrow="Security Deposit"
            title="Refundable deposit defaults"
            description="Set whether this rental usually requires a refundable security deposit and how that deposit should be quoted."
          />
          <div className="rental-check-grid">
            <label className="checkline">
              <input type="checkbox" checked={depositRequired} onChange={(event) => setDepositRequired(event.target.checked)} />
              <span>Require a refundable security deposit</span>
            </label>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Deposit type</label>
              <select
                className="input"
                value={depositType}
                onChange={(event) => setDepositType(event.target.value as RentalDepositType)}
                disabled={!depositRequired}
              >
                <option value="flat">Flat amount</option>
                <option value="per_item">Per item</option>
                <option value="percent">Percent of rental subtotal</option>
              </select>
            </div>
            <div className="field">
              <label className="label">{depositType === "percent" ? "Deposit percent" : "Deposit amount"}</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                disabled={!depositRequired}
                onChange={(event) => setDepositAmount(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Replacement cost</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={replacementCost}
                onChange={(event) => setReplacementCost(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Deposit terms</label>
            <textarea
              className="textarea"
              rows={4}
              value={depositTerms}
              onChange={(event) => setDepositTerms(event.target.value)}
              placeholder="Explain when the deposit is collected, when inspection happens, and how refunds are handled."
            />
          </div>

          <div className="field">
            <label className="label">Damage / handling notes</label>
            <textarea
              className="textarea"
              rows={4}
              value={itemDamageNotes}
              onChange={(event) => setItemDamageNotes(event.target.value)}
              placeholder="Capture common damage risks, handling expectations, or cleaning notes for this rental item."
            />
          </div>
        </div>

        <div className="card admin-table-card rental-editor-card">
          <AdminSectionHeader eyebrow="Visibility" title="Public status and merchandising" />
          <div className="rental-check-grid">
            <label className="checkline">
              <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
              <span>Feature on rental surfaces</span>
            </label>
            <label className="checkline">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
              <span>Visible on the public rentals page</span>
            </label>
          </div>
        </div>

        {item ? (
          <RentalDepositTracking rentalItemId={item.id} initialRecords={depositRecords} />
        ) : null}

        <div className="card admin-table-card rental-editor-card">
          <AdminActionRow
            secondary={
              <button type="button" className="btn secondary" onClick={() => router.push("/admin/rentals")}>
                Back to rentals
              </button>
            }
            primary={
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : item ? "Save rental item" : "Create rental item"}
              </button>
            }
            destructive={
              item ? (
                <button type="button" className="btn" disabled={deleting} onClick={handleDelete}>
                  {deleting ? "Deleting..." : "Delete item"}
                </button>
              ) : null
            }
          />
          {message ? <p className="error">{message}</p> : null}
        </div>
      </div>

      <aside className="rental-editor-sidebar">
        <RentalQuotePreview
          baseRentalPrice={Number(baseRentalPrice || 0)}
          priceType={priceType}
          minimumOrderQuantity={Math.max(Number(minimumOrderQuantity || 1), 1)}
          deliveryAvailable={deliveryAvailable}
          setupAvailable={setupAvailable}
          breakdownAvailable={breakdownAvailable}
          defaultDeliveryFee={Number(defaultDeliveryFee || 0)}
          defaultSetupFee={Number(defaultSetupFee || 0)}
          defaultBreakdownFee={Number(defaultBreakdownFee || 0)}
          depositRequired={depositRequired}
          depositType={depositType}
          depositAmount={Number(depositAmount || 0)}
        />
      </aside>
    </form>
  );
}
