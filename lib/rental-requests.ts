import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { formatMoney } from "@/lib/rental-shared";
import { formatDeliveryFeeLabel } from "@/lib/rental-quote-pricing";
import type { RentalRequestStatus } from "@/lib/rental-requests.types";

export type { RentalRequestStatus } from "@/lib/rental-requests.types";

export type RentalQuoteRequestItem = {
  id: string;
  rental_request_id: string;
  rental_item_id: string | null;
  item_name: string;
  item_slug: string | null;
  quantity: number;
  unit_price: number;
  price_type: "per_item" | "per_set" | "flat_rate";
  line_subtotal: number;
  security_deposit_amount: number;
  created_at: string;
};

export type RentalQuoteRequest = {
  id: string;
  client_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  event_date: string | null;
  venue_name: string | null;
  event_address: string | null;
  event_zip: string | null;
  occasion_label: string | null;
  guest_count: number | null;
  notes: string | null;
  include_delivery: boolean;
  include_setup: boolean;
  include_breakdown: boolean;
  rental_subtotal: number;
  delivery_fee: number;
  distance_miles: number | null;
  delivery_custom_quote_required: boolean;
  setup_fee: number;
  breakdown_fee: number;
  refundable_security_deposit: number;
  estimated_total: number;
  status: RentalRequestStatus;
  admin_notes: string | null;
  quoted_at: string | null;
  reserved_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: RentalQuoteRequestItem[];
  quote?: RentalQuote | null;
};

export type RentalQuote = {
  id: string;
  rental_request_id: string;
  chair_quantity: number;
  chair_unit_price: number;
  chair_subtotal: number;
  distance_miles: number | null;
  delivery_fee: number;
  delivery_custom_quote_required: boolean;
  setup_fee: number;
  breakdown_fee: number;
  refundable_deposit: number;
  total_quote: number;
  quote_notes: string | null;
  status: "draft" | "sent" | "accepted" | "paid" | "completed" | "cancelled";
  sent_at: string | null;
  accepted_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function mapRequest(row: Record<string, unknown>): RentalQuoteRequest {
  return {
    id: String(row.id),
    client_id: row.client_id ? String(row.client_id) : null,
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    event_date: row.event_date ? String(row.event_date) : null,
    venue_name: row.venue_name ? String(row.venue_name) : null,
    event_address: row.event_address ? String(row.event_address) : null,
    event_zip: row.event_zip ? String(row.event_zip) : null,
    occasion_label: row.occasion_label ? String(row.occasion_label) : null,
    guest_count: row.guest_count == null ? null : Math.trunc(toNumber(row.guest_count, 0)),
    notes: row.notes ? String(row.notes) : null,
    include_delivery: Boolean(row.include_delivery),
    include_setup: Boolean(row.include_setup),
    include_breakdown: Boolean(row.include_breakdown),
    rental_subtotal: toNumber(row.rental_subtotal, 0),
    delivery_fee: toNumber(row.delivery_fee, 0),
    distance_miles: row.distance_miles == null ? null : toNumber(row.distance_miles, 0),
    delivery_custom_quote_required: Boolean(row.delivery_custom_quote_required),
    setup_fee: toNumber(row.setup_fee, 0),
    breakdown_fee: toNumber(row.breakdown_fee, 0),
    refundable_security_deposit: toNumber(row.refundable_security_deposit, 0),
    estimated_total: toNumber(row.estimated_total, 0),
    status: (row.status as RentalRequestStatus) || "requested",
    admin_notes: row.admin_notes ? String(row.admin_notes) : null,
    quoted_at: row.quoted_at ? String(row.quoted_at) : null,
    reserved_at: row.reserved_at ? String(row.reserved_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapQuote(row: Record<string, unknown>): RentalQuote {
  return {
    id: String(row.id),
    rental_request_id: String(row.rental_request_id),
    chair_quantity: Math.max(Math.trunc(toNumber(row.chair_quantity, 0)), 0),
    chair_unit_price: toNumber(row.chair_unit_price, 0),
    chair_subtotal: toNumber(row.chair_subtotal, 0),
    distance_miles: row.distance_miles == null ? null : toNumber(row.distance_miles, 0),
    delivery_fee: toNumber(row.delivery_fee, 0),
    delivery_custom_quote_required: Boolean(row.delivery_custom_quote_required),
    setup_fee: toNumber(row.setup_fee, 0),
    breakdown_fee: toNumber(row.breakdown_fee, 0),
    refundable_deposit: toNumber(row.refundable_deposit, 0),
    total_quote: toNumber(row.total_quote, 0),
    quote_notes: row.quote_notes ? String(row.quote_notes) : null,
    status: (row.status as RentalQuote["status"]) || "draft",
    sent_at: row.sent_at ? String(row.sent_at) : null,
    accepted_at: row.accepted_at ? String(row.accepted_at) : null,
    paid_at: row.paid_at ? String(row.paid_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapItem(row: Record<string, unknown>): RentalQuoteRequestItem {
  return {
    id: String(row.id),
    rental_request_id: String(row.rental_request_id),
    rental_item_id: row.rental_item_id ? String(row.rental_item_id) : null,
    item_name: String(row.item_name ?? ""),
    item_slug: row.item_slug ? String(row.item_slug) : null,
    quantity: Math.max(Math.trunc(toNumber(row.quantity, 1)), 1),
    unit_price: toNumber(row.unit_price, 0),
    price_type: (row.price_type as RentalQuoteRequestItem["price_type"]) || "per_item",
    line_subtotal: toNumber(row.line_subtotal, 0),
    security_deposit_amount: toNumber(row.security_deposit_amount, 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getRentalQuoteRequests(options?: {
  status?: RentalRequestStatus | "all";
  limit?: number;
}) {
  let query = supabaseAdmin
    .from("rental_quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [] as RentalQuoteRequest[];
  return data.map((row) => mapRequest(row as Record<string, unknown>));
}

export async function getRentalQuoteRequestById(id: string) {
  const { data: request, error } = await supabaseAdmin
    .from("rental_quote_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !request) {
    return null;
  }

  const { data: items } = await supabaseAdmin
    .from("rental_quote_request_items")
    .select("*")
    .eq("rental_request_id", id)
    .order("created_at", { ascending: true });

  const { data: quote } = await supabaseAdmin
    .from("rental_quotes")
    .select("*")
    .eq("rental_request_id", id)
    .maybeSingle();

  return {
    ...mapRequest(request as Record<string, unknown>),
    items: (items ?? []).map((row) => mapItem(row as Record<string, unknown>)),
    quote: quote ? mapQuote(quote as Record<string, unknown>) : null,
  } satisfies RentalQuoteRequest;
}

export function getRentalRequestMetrics(requests: RentalQuoteRequest[]) {
  return {
    total: requests.length,
    requested: requests.filter((request) => request.status === "requested").length,
    reviewing: requests.filter((request) => request.status === "reviewing").length,
    quoted: requests.filter((request) => request.status === "quoted").length,
    accepted: requests.filter((request) => request.status === "accepted").length,
    paid: requests.filter((request) => request.status === "paid").length,
    reserved: requests.filter((request) => request.status === "reserved").length,
    totalValue: requests.reduce((sum, request) => sum + request.estimated_total, 0),
  };
}

export function getRentalRequestStatusLabel(status: RentalRequestStatus) {
  if (status === "requested") return "New";
  return status.replace(/_/g, " ");
}

export function getRentalRequestSummary(request: RentalQuoteRequest) {
  const pieces = [
    request.occasion_label || "Rental request",
    request.event_date || "Date pending",
    request.venue_name || "Venue pending",
  ].filter(Boolean);

  return pieces.join(" • ");
}

export function getRentalRequestTotalLabel(request: RentalQuoteRequest) {
  if (request.quote) {
    return `${formatMoney(request.quote.total_quote)} total`;
  }

  if (request.delivery_custom_quote_required) {
    return `Delivery ${formatDeliveryFeeLabel(request)}`;
  }

  return request.estimated_total > 0 ? `${formatMoney(request.estimated_total)} total` : "Awaiting quote";
}
