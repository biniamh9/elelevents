import { supabaseAdmin } from "@/lib/supabase/admin-client";
import type { RentalItemInput } from "@/lib/validations/rentals";
export {
  calculateDepositRefundAmount,
  calculateRentalQuoteTotals,
  calculateRentalSecurityDeposit,
  calculateRentalSubtotal,
  formatMoney,
  formatRentalPrice,
  slugifyRentalName,
} from "@/lib/rental-shared";
import {
  type RentalDepositRecord,
  type RentalDepositStatus,
  type RentalDepositType,
  type RentalInspectionStatus,
  type RentalItem,
  type RentalItemImage,
  type RentalPriceType,
  type RentalRefundStatus,
} from "@/lib/rental-shared";

export type {
  RentalDepositRecord,
  RentalDepositStatus,
  RentalDepositType,
  RentalInspectionStatus,
  RentalItem,
  RentalItemImage,
  RentalPriceType,
  RentalRefundStatus,
} from "@/lib/rental-shared";

type RentalItemRow = Omit<RentalItem, "images">;

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function mapRentalItemRow(row: Record<string, unknown>): RentalItemRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    category: row.category ? String(row.category) : null,
    short_description: row.short_description ? String(row.short_description) : null,
    full_description: row.full_description ? String(row.full_description) : null,
    featured_image_url: row.featured_image_url ? String(row.featured_image_url) : null,
    featured_image_path: row.featured_image_path ? String(row.featured_image_path) : null,
    base_rental_price: toNumber(row.base_rental_price, 0),
    price_type: (row.price_type as RentalPriceType) || "per_item",
    available_quantity: Math.max(Math.trunc(toNumber(row.available_quantity, 0)), 0),
    minimum_order_quantity: Math.max(Math.trunc(toNumber(row.minimum_order_quantity, 1)), 1),
    delivery_available: Boolean(row.delivery_available),
    setup_available: Boolean(row.setup_available),
    breakdown_available: Boolean(row.breakdown_available),
    default_delivery_fee: toNumber(row.default_delivery_fee, 0),
    default_setup_fee: toNumber(row.default_setup_fee, 0),
    default_breakdown_fee: toNumber(row.default_breakdown_fee, 0),
    deposit_required: Boolean(row.deposit_required),
    deposit_type: (row.deposit_type as RentalDepositType) || "flat",
    deposit_amount: toNumber(row.deposit_amount, 0),
    replacement_cost: toNumber(row.replacement_cost, 0),
    deposit_terms: row.deposit_terms ? String(row.deposit_terms) : null,
    damage_notes: row.damage_notes ? String(row.damage_notes) : null,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    sort_order: Math.trunc(toNumber(row.sort_order, 0)),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapRentalItemImage(row: Record<string, unknown>): RentalItemImage {
  return {
    id: String(row.id),
    rental_item_id: String(row.rental_item_id),
    image_url: String(row.image_url ?? ""),
    image_path: row.image_path ? String(row.image_path) : null,
    sort_order: Math.trunc(toNumber(row.sort_order, 0)),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getRentalItems(options?: {
  activeOnly?: boolean;
  featuredOnly?: boolean;
  category?: string | null;
  limit?: number;
}) {
  let query = supabaseAdmin
    .from("rental_items")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [] as RentalItem[];
  }

  return data.map((row) => mapRentalItemRow(row as Record<string, unknown>));
}

export async function getRentalItemBySlug(slug: string) {
  const { data: item, error } = await supabaseAdmin
    .from("rental_items")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !item) {
    return null;
  }

  const { data: images } = await supabaseAdmin
    .from("rental_item_images")
    .select("*")
    .eq("rental_item_id", item.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    ...mapRentalItemRow(item as Record<string, unknown>),
    images: (images ?? []).map((row) => mapRentalItemImage(row as Record<string, unknown>)),
  } satisfies RentalItem;
}

export async function getRentalItemById(id: string) {
  const { data: item, error } = await supabaseAdmin
    .from("rental_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !item) {
    return null;
  }

  const { data: images } = await supabaseAdmin
    .from("rental_item_images")
    .select("*")
    .eq("rental_item_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    ...mapRentalItemRow(item as Record<string, unknown>),
    images: (images ?? []).map((row) => mapRentalItemImage(row as Record<string, unknown>)),
  } satisfies RentalItem;
}

export function getRentalCategories(items: RentalItem[]) {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort();
}

function mapRentalDepositRecord(row: Record<string, unknown>): RentalDepositRecord {
  return {
    id: String(row.id),
    rental_item_id: String(row.rental_item_id),
    reference_label: row.reference_label ? String(row.reference_label) : null,
    deposit_collected_amount: toNumber(row.deposit_collected_amount, 0),
    deposit_status: (row.deposit_status as RentalDepositStatus) || "pending",
    inspection_status: (row.inspection_status as RentalInspectionStatus) || "pending",
    damage_deduction_amount: toNumber(row.damage_deduction_amount, 0),
    refund_amount: toNumber(row.refund_amount, 0),
    refund_status: (row.refund_status as RentalRefundStatus) || "not_started",
    refund_date: row.refund_date ? String(row.refund_date) : null,
    damage_notes: row.damage_notes ? String(row.damage_notes) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getRentalDepositRecords(rentalItemId: string) {
  const { data, error } = await supabaseAdmin
    .from("rental_deposit_records")
    .select("*")
    .eq("rental_item_id", rentalItemId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [] as RentalDepositRecord[];
  }

  return data.map((row) => mapRentalDepositRecord(row as Record<string, unknown>));
}

export function toRentalItemInput(raw: Record<string, unknown>): RentalItemInput {
  return {
    name: String(raw.name ?? "").trim(),
    slug: String(raw.slug ?? "").trim(),
    category: raw.category ? String(raw.category).trim() || null : null,
    short_description: raw.short_description ? String(raw.short_description).trim() || null : null,
    full_description: raw.full_description ? String(raw.full_description).trim() || null : null,
    base_rental_price: Math.max(toNumber(raw.base_rental_price, 0), 0),
    price_type: (raw.price_type as RentalPriceType) || "per_item",
    available_quantity: Math.max(Math.trunc(toNumber(raw.available_quantity, 0)), 0),
    minimum_order_quantity: Math.max(Math.trunc(toNumber(raw.minimum_order_quantity, 1)), 1),
    delivery_available: Boolean(raw.delivery_available),
    setup_available: Boolean(raw.setup_available),
    breakdown_available: Boolean(raw.breakdown_available),
    default_delivery_fee: Math.max(toNumber(raw.default_delivery_fee, 0), 0),
    default_setup_fee: Math.max(toNumber(raw.default_setup_fee, 0), 0),
    default_breakdown_fee: Math.max(toNumber(raw.default_breakdown_fee, 0), 0),
    deposit_required: Boolean(raw.deposit_required),
    deposit_type: (raw.deposit_type as RentalDepositType) || "flat",
    deposit_amount: Math.max(toNumber(raw.deposit_amount, 0), 0),
    replacement_cost: Math.max(toNumber(raw.replacement_cost, 0), 0),
    deposit_terms: raw.deposit_terms ? String(raw.deposit_terms).trim() || null : null,
    damage_notes: raw.damage_notes ? String(raw.damage_notes).trim() || null : null,
    featured: Boolean(raw.featured),
    active: Boolean(raw.active),
    sort_order: Math.max(Math.trunc(toNumber(raw.sort_order, 0)), 0),
  };
}
