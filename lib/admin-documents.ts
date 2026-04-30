import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  buildDocumentNumber,
  seedDocumentFromContext,
  type ClientDocumentLineItem,
  type ClientDocumentPayment,
  type ClientDocumentRecord,
  type ClientDocumentType,
  type ClientDocumentWithRelations,
} from "@/lib/client-documents";

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

export async function buildSeedDocument(input: {
  type: ClientDocumentType;
  inquiryId?: string | null;
  contractId?: string | null;
  sourceDocumentId?: string | null;
}) {
  const sourceDocument = input.sourceDocumentId
    ? await getDocumentById(input.sourceDocumentId)
    : null;

  const inquiryPromise = input.inquiryId
    ? supabaseAdmin
        .from("event_inquiries")
        .select("id, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, venue_address")
        .eq("id", input.inquiryId)
        .maybeSingle()
    : Promise.resolve({ data: null });
  const pricingPromise = input.inquiryId
    ? supabaseAdmin
        .from("inquiry_quote_pricing")
        .select("*")
        .eq("inquiry_id", input.inquiryId)
        .maybeSingle()
    : Promise.resolve({ data: null });
  const lineItemsPromise = input.inquiryId
    ? supabaseAdmin
        .from("inquiry_quote_line_items")
        .select("*")
        .eq("inquiry_id", input.inquiryId)
        .order("sort_order", { ascending: true, nullsFirst: false })
    : Promise.resolve({ data: [] });
  const contractPromise = input.contractId
    ? supabaseAdmin
        .from("contracts")
        .select("id, client_name, client_email, client_phone, event_type, event_date, guest_count, venue_name, venue_address, contract_total, deposit_amount, balance_due, balance_due_date, deposit_paid")
        .eq("id", input.contractId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [{ data: inquiry }, { data: pricing }, { data: quoteLineItems }, { data: contract }] =
    await Promise.all([inquiryPromise, pricingPromise, lineItemsPromise, contractPromise]);

  const count = await getDocumentCount(input.type);
  const seeded = seedDocumentFromContext(input.type, {
    inquiry,
    contract,
    pricing,
    quoteLineItems: quoteLineItems ?? [],
    sourceDocument,
  });

  return {
    ...seeded,
    document_number: buildDocumentNumber(input.type, count),
    inquiry_id: seeded.inquiry_id ?? input.inquiryId ?? null,
    contract_id: seeded.contract_id ?? input.contractId ?? null,
  };
}
