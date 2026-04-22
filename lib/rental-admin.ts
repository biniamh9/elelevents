import { randomUUID } from "crypto";

import { rentalItemInputSchema, type RentalItemInput } from "@/lib/validations/rentals";
import {
  calculateDepositRefundAmount,
  slugifyRentalName,
  type RentalDepositStatus,
  type RentalDepositType,
  type RentalInspectionStatus,
  type RentalItemImage,
  type RentalPriceType,
  type RentalRefundStatus,
} from "@/lib/rental-shared";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const RENTAL_BUCKET = "rentals";
const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value === "true" || value === "on" || value === "1";
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  return Math.trunc(parseNumber(value, fallback));
}

function parseText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function ensureImageFile(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) {
    return null;
  }

  return entry;
}

function getContentType(file: File, extension: string) {
  if (file.type && allowedMimeTypes.has(file.type)) {
    return file.type;
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

async function uploadRentalImage(file: File, prefix: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
    throw new Error("Only JPG, JPEG, PNG, and WEBP files are allowed.");
  }

  const contentType = getContentType(file, extension);
  const filePath = `${prefix}/${Date.now()}-${randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage.from(RENTAL_BUCKET).upload(filePath, file, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage.from(RENTAL_BUCKET).getPublicUrl(filePath);
  return { imageUrl: data.publicUrl, imagePath: filePath };
}

export async function removeStoragePaths(paths: Array<string | null | undefined>) {
  const normalized = paths.filter((value): value is string => Boolean(value));

  if (!normalized.length) {
    return;
  }

  await supabaseAdmin.storage.from(RENTAL_BUCKET).remove(normalized);
}

export function parseRentalItemFormData(formData: FormData): RentalItemInput {
  const name = parseText(formData.get("name")) ?? "";
  const rawSlug = parseText(formData.get("slug"));
  const slug = rawSlug ? slugifyRentalName(rawSlug) : slugifyRentalName(name);

  return rentalItemInputSchema.parse({
    name,
    slug,
    category: parseText(formData.get("category")),
    short_description: parseText(formData.get("short_description")),
    full_description: parseText(formData.get("full_description")),
    base_rental_price: parseNumber(formData.get("base_rental_price"), 0),
    price_type: (parseText(formData.get("price_type")) as RentalPriceType | null) ?? "per_item",
    available_quantity: parseInteger(formData.get("available_quantity"), 0),
    minimum_order_quantity: parseInteger(formData.get("minimum_order_quantity"), 1),
    delivery_available: parseBoolean(formData.get("delivery_available"), false),
    setup_available: parseBoolean(formData.get("setup_available"), false),
    breakdown_available: parseBoolean(formData.get("breakdown_available"), false),
    default_delivery_fee: parseNumber(formData.get("default_delivery_fee"), 0),
    default_setup_fee: parseNumber(formData.get("default_setup_fee"), 0),
    default_breakdown_fee: parseNumber(formData.get("default_breakdown_fee"), 0),
    deposit_required: parseBoolean(formData.get("deposit_required"), false),
    deposit_type: (parseText(formData.get("deposit_type")) as RentalDepositType | null) ?? "flat",
    deposit_amount: parseNumber(formData.get("deposit_amount"), 0),
    replacement_cost: parseNumber(formData.get("replacement_cost"), 0),
    deposit_terms: parseText(formData.get("deposit_terms")),
    damage_notes: parseText(formData.get("damage_notes")),
    featured: parseBoolean(formData.get("featured"), false),
    active: parseBoolean(formData.get("active"), false),
    sort_order: parseInteger(formData.get("sort_order"), 0),
  });
}

export function parseRentalDepositRecordFormData(formData: FormData) {
  const depositCollectedAmount = Math.max(parseNumber(formData.get("deposit_collected_amount"), 0), 0);
  const damageDeductionAmount = Math.max(parseNumber(formData.get("damage_deduction_amount"), 0), 0);
  const refundAmount = parseNumber(
    formData.get("refund_amount"),
    calculateDepositRefundAmount(depositCollectedAmount, damageDeductionAmount)
  );
  const refundDate = parseText(formData.get("refund_date"));
  const normalizedRefundDate =
    refundDate && !Number.isNaN(new Date(refundDate).getTime())
      ? new Date(refundDate).toISOString()
      : null;

  return {
    reference_label: parseText(formData.get("reference_label")),
    deposit_collected_amount: depositCollectedAmount,
    deposit_status:
      (parseText(formData.get("deposit_status")) as RentalDepositStatus | null) ?? "pending",
    inspection_status:
      (parseText(formData.get("inspection_status")) as RentalInspectionStatus | null) ?? "pending",
    damage_deduction_amount: damageDeductionAmount,
    refund_amount: Math.max(refundAmount, 0),
    refund_status:
      (parseText(formData.get("refund_status")) as RentalRefundStatus | null) ?? "not_started",
    refund_date: normalizedRefundDate,
    damage_notes: parseText(formData.get("damage_notes")),
  };
}

export function getFeaturedImageFile(formData: FormData) {
  return ensureImageFile(formData.get("featured_image"));
}

export function getGalleryImageFiles(formData: FormData) {
  return formData
    .getAll("gallery_images")
    .map((entry) => (entry instanceof File && entry.size > 0 ? entry : null))
    .filter((entry): entry is File => Boolean(entry));
}

export function parseRetainedGalleryIds(formData: FormData) {
  const raw = formData.get("retained_gallery_ids");
  if (typeof raw !== "string" || !raw.trim()) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
}

export async function insertRentalGalleryImages(itemId: string, files: File[], startingSortOrder = 0) {
  if (!files.length) {
    return [] as RentalItemImage[];
  }

  const rows = [] as Array<{
    rental_item_id: string;
    image_url: string;
    image_path: string;
    sort_order: number;
  }>;

  for (const [index, file] of files.entries()) {
    const uploaded = await uploadRentalImage(file, `${itemId}/gallery`);
    rows.push({
      rental_item_id: itemId,
      image_url: uploaded.imageUrl,
      image_path: uploaded.imagePath,
      sort_order: startingSortOrder + index,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("rental_item_images")
    .insert(rows)
    .select("*");

  if (error) {
    await removeStoragePaths(rows.map((row) => row.image_path));
    throw new Error(error.message);
  }

  return (data ?? []) as RentalItemImage[];
}

export async function replaceFeaturedImage(
  itemId: string,
  file: File | null,
  currentPath?: string | null
) {
  if (!file) {
    return null;
  }

  const uploaded = await uploadRentalImage(file, `${itemId}/featured`);

  if (currentPath) {
    await removeStoragePaths([currentPath]);
  }

  return uploaded;
}
