import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  calculateDocumentTotals,
  buildDocumentNumber,
  seedDocumentFromContext,
  type ClientDocumentLineItem,
  type ClientDocumentPayment,
  type ClientDocumentRecord,
  type ClientDocumentType,
  type ClientDocumentWithRelations,
} from "@/lib/client-documents";
import {
  calculateQuoteTotals,
  DEFAULT_BASE_FEE,
  DEFAULT_ITEMIZED_DISCLAIMER,
  type InquiryQuoteLineItem,
  type InquiryQuotePricing,
} from "@/lib/admin-pricing";

const QUOTE_BASE_FEE_TITLE = "Base event fee";

export async function getDocumentCount(type: ClientDocumentType) {
  const { count } = await supabaseAdmin
    .from("client_documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", type);

  return count ?? 0;
}

export async function getDocumentById(id: string) {
  const { data: document, error } = await supabaseAdmin
    .from("client_documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !document) {
    return null;
  }

  const [
    { data: lineItems },
    { data: payments },
    inquiryResult,
    contractResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("client_document_line_items")
      .select("*")
      .eq("document_id", id)
      .order("display_order", { ascending: true }),
    supabaseAdmin
      .from("client_document_payments")
      .select("*")
      .eq("document_id", id)
      .order("payment_date", { ascending: false }),
    document.inquiry_id
      ? supabaseAdmin
          .from("event_inquiries")
          .select("guest_count, event_type, event_date, venue_name, venue_address")
          .eq("id", document.inquiry_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    document.contract_id
      ? supabaseAdmin
          .from("contracts")
          .select("guest_count, event_type, event_date, venue_name, venue_address")
          .eq("id", document.contract_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const inquiry = inquiryResult?.data ?? null;
  const contract = contractResult?.data ?? null;

  return {
    ...(document as ClientDocumentRecord),
    guest_count: (document as ClientDocumentRecord).guest_count
      ?? contract?.guest_count
      ?? inquiry?.guest_count
      ?? null,
    event_type: (document as ClientDocumentRecord).event_type
      ?? contract?.event_type
      ?? inquiry?.event_type
      ?? null,
    event_date: (document as ClientDocumentRecord).event_date
      ?? contract?.event_date
      ?? inquiry?.event_date
      ?? null,
    venue_name: (document as ClientDocumentRecord).venue_name
      ?? contract?.venue_name
      ?? inquiry?.venue_name
      ?? null,
    venue_address: (document as ClientDocumentRecord).venue_address
      ?? contract?.venue_address
      ?? inquiry?.venue_address
      ?? null,
    line_items: (lineItems ?? []) as ClientDocumentLineItem[],
    payments: (payments ?? []) as ClientDocumentPayment[],
  } as ClientDocumentWithRelations;
}

export async function getQuoteDocumentByInquiryId(inquiryId: string) {
  const { data: document } = await supabaseAdmin
    .from("client_documents")
    .select("id")
    .eq("inquiry_id", inquiryId)
    .eq("document_type", "quote")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!document?.id) {
    return null;
  }

  return getDocumentById(document.id);
}

export function mapQuoteDocumentToLegacyPricing(
  document: ClientDocumentWithRelations | null
): InquiryQuotePricing | null {
  if (!document) return null;

  const baseFeeLine = document.line_items.find((item) => item.title === QUOTE_BASE_FEE_TITLE);
  const mappedLineItems = mapQuoteDocumentToLegacyLineItems(document);
  const calculated = calculateQuoteTotals(
    {
      base_fee: Number(baseFeeLine?.unit_price ?? DEFAULT_BASE_FEE),
      discount_amount: Number(document.discount_amount ?? 0),
      delivery_fee: Number(document.delivery_fee ?? 0),
      labor_adjustment: Number(document.setup_fee ?? 0),
      tax_amount: Number(document.tax_amount ?? 0),
      manual_total_override: null,
    },
    mappedLineItems
  );

  return {
    inquiry_id: document.inquiry_id ?? "",
    base_fee: Number(baseFeeLine?.unit_price ?? DEFAULT_BASE_FEE),
    discount_amount: Number(document.discount_amount ?? 0),
    delivery_fee: Number(document.delivery_fee ?? 0),
    labor_adjustment: Number(document.setup_fee ?? 0),
    tax_amount: Number(document.tax_amount ?? 0),
    manual_total_override:
      Number(document.total_amount ?? 0) !== Number(calculated.calculatedTotal ?? 0)
        ? Number(document.total_amount ?? 0)
        : null,
    notes: document.notes ?? null,
    draft_status:
      document.status === "sent" || document.status === "accepted"
        ? "shared_with_customer"
        : "internal_draft",
    client_disclaimer: document.inclusions ?? DEFAULT_ITEMIZED_DISCLAIMER,
    generated_at: document.created_at ?? null,
    ready_to_send_at: null,
    shared_with_customer_at:
      document.status === "sent" || document.status === "accepted"
        ? document.updated_at ?? document.created_at ?? null
        : null,
  };
}

export function mapQuoteDocumentToLegacyLineItems(
  document: ClientDocumentWithRelations | null
): InquiryQuoteLineItem[] {
  if (!document) return [];

  return document.line_items
    .filter((item) => item.title !== QUOTE_BASE_FEE_TITLE)
    .map((item, index) => ({
      id: item.id,
      inquiry_id: document.inquiry_id ?? "",
      pricing_catalog_item_id: null,
      item_name: item.title,
      category: null,
      variant: null,
      unit_label: "each",
      unit_price: Number(item.unit_price ?? 0),
      quantity: Number(item.quantity ?? 0),
      line_total: Number(item.total_price ?? 0),
      notes: item.description ?? null,
      sort_order: item.display_order ?? index,
      is_custom: true,
    }));
}

export async function upsertQuoteDocumentForInquiry(input: {
  inquiryId: string;
  inquiry: {
    id: string;
    client_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    event_type?: string | null;
    event_date?: string | null;
    guest_count?: number | null;
    venue_name?: string | null;
    venue_address?: string | null;
  };
  eventProjectId?: string | null;
  status?: "draft" | "sent" | "accepted" | "expired";
  pricing: {
    base_fee: number;
    discount_amount: number;
    delivery_fee: number;
    labor_adjustment: number;
    tax_amount: number;
    manual_total_override: number | null;
    notes: string | null;
    client_disclaimer: string | null;
  };
  lineItems: InquiryQuoteLineItem[];
}) {
  const existing = await getQuoteDocumentByInquiryId(input.inquiryId);

  const customerName =
    [input.inquiry.first_name, input.inquiry.last_name].filter(Boolean).join(" ").trim() || "Client";
  const quoteLineItems: ClientDocumentLineItem[] = [
    {
      id: existing?.line_items.find((item) => item.title === QUOTE_BASE_FEE_TITLE)?.id ?? "base-fee",
      title: QUOTE_BASE_FEE_TITLE,
      description: "Core planning and design direction",
      quantity: 1,
      unit_price: Number(input.pricing.base_fee ?? DEFAULT_BASE_FEE),
      total_price: Number(input.pricing.base_fee ?? DEFAULT_BASE_FEE),
      display_order: 0,
    },
    ...input.lineItems.map((item, index) => ({
      id: item.id || `quote-line-${index}`,
      title: item.item_name,
      description: item.notes ?? null,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      total_price: Number(item.line_total ?? 0),
      display_order: index + 1,
    })),
  ];

  const totals = calculateDocumentTotals({
    lineItems: quoteLineItems,
    deliveryFee: input.pricing.delivery_fee,
    setupFee: input.pricing.labor_adjustment,
    discountAmount: input.pricing.discount_amount,
    taxAmount: input.pricing.tax_amount,
    amountPaid: existing?.amount_paid ?? 0,
    depositRequired: existing?.deposit_required ?? 0,
  });

  const totalAmount =
    input.pricing.manual_total_override !== null
      ? Number(input.pricing.manual_total_override)
      : totals.totalAmount;
  const balanceDue = Number(Math.max(totalAmount - Number(existing?.amount_paid ?? 0), 0).toFixed(2));

  const payload = {
    inquiry_id: input.inquiryId,
    contract_id: existing?.contract_id ?? null,
    event_project_id: input.eventProjectId ?? existing?.["event_project_id" as never] ?? null,
    document_type: "quote" as const,
    document_number:
      existing?.document_number ?? buildDocumentNumber("quote", await getDocumentCount("quote")),
    status: input.status ?? existing?.status ?? "draft",
    issue_date: existing?.issue_date ?? new Date().toISOString().slice(0, 10),
    due_date: null,
    expiration_date: existing?.expiration_date ?? null,
    customer_name: customerName,
    customer_email: input.inquiry.email ?? null,
    customer_phone: input.inquiry.phone ?? null,
    event_type: input.inquiry.event_type ?? null,
    event_date: input.inquiry.event_date ?? null,
    guest_count: input.inquiry.guest_count ?? null,
    venue_name: input.inquiry.venue_name ?? null,
    venue_address: input.inquiry.venue_address ?? null,
    notes: input.pricing.notes,
    inclusions: input.pricing.client_disclaimer ?? DEFAULT_ITEMIZED_DISCLAIMER,
    exclusions: existing?.exclusions ?? null,
    payment_instructions: existing?.payment_instructions ?? null,
    payment_terms: existing?.payment_terms ?? null,
    subtotal: totals.subtotal,
    delivery_fee: Number(input.pricing.delivery_fee ?? 0),
    setup_fee: Number(input.pricing.labor_adjustment ?? 0),
    discount_amount: Number(input.pricing.discount_amount ?? 0),
    tax_amount: Number(input.pricing.tax_amount ?? 0),
    total_amount: totalAmount,
    deposit_required: Number(existing?.deposit_required ?? 0),
    amount_paid: Number(existing?.amount_paid ?? 0),
    balance_due: balanceDue,
    related_quote_id: existing?.related_quote_id ?? null,
    related_invoice_id: existing?.related_invoice_id ?? null,
  };

  const { data: saved, error } = existing
    ? await supabaseAdmin
        .from("client_documents")
        .update(payload)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabaseAdmin
        .from("client_documents")
        .insert(payload)
        .select("id")
        .single();

  if (error || !saved?.id) {
    throw new Error(error?.message || "Failed to save quote document");
  }

  await supabaseAdmin.from("client_document_line_items").delete().eq("document_id", saved.id);
  if (quoteLineItems.length) {
    const { error: itemError } = await supabaseAdmin.from("client_document_line_items").insert(
      quoteLineItems.map((item, index) => ({
        document_id: saved.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        display_order: index,
      }))
    );

    if (itemError) {
      throw new Error(itemError.message);
    }
  }

  return getDocumentById(saved.id);
}

export async function buildSeedDocument(input: {
  type: ClientDocumentType;
  inquiryId?: string | null;
  contractId?: string | null;
  sourceDocumentId?: string | null;
}) {
  const sourceDocument = input.sourceDocumentId
    ? await getDocumentById(input.sourceDocumentId)
    : null;
  const sourceQuoteDocument =
    !sourceDocument && input.type !== "quote" && input.inquiryId
      ? await getQuoteDocumentByInquiryId(input.inquiryId)
      : null;

  const inquiryPromise = input.inquiryId
    ? supabaseAdmin
        .from("event_inquiries")
        .select("id, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, venue_address")
        .eq("id", input.inquiryId)
        .maybeSingle()
    : Promise.resolve({ data: null });
  const contractPromise = input.contractId
    ? supabaseAdmin
        .from("contracts")
        .select("id, client_name, client_email, client_phone, event_type, event_date, guest_count, venue_name, venue_address, contract_total, deposit_amount, balance_due, balance_due_date, deposit_paid")
        .eq("id", input.contractId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [{ data: inquiry }, { data: contract }] =
    await Promise.all([inquiryPromise, contractPromise]);

  const count = await getDocumentCount(input.type);
  const seeded = seedDocumentFromContext(input.type, {
    inquiry,
    contract,
    pricing: mapQuoteDocumentToLegacyPricing(sourceDocument ?? sourceQuoteDocument),
    quoteLineItems: mapQuoteDocumentToLegacyLineItems(sourceDocument ?? sourceQuoteDocument),
    sourceDocument: sourceDocument ?? sourceQuoteDocument,
  });

  return {
    ...seeded,
    document_number: buildDocumentNumber(input.type, count),
    inquiry_id: seeded.inquiry_id ?? input.inquiryId ?? null,
    contract_id: seeded.contract_id ?? input.contractId ?? null,
  };
}
