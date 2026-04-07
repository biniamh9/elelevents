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

  const [{ data: lineItems }, { data: payments }] = await Promise.all([
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
  ]);

  return {
    ...(document as ClientDocumentRecord),
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
        .select("id, first_name, last_name, email, phone, event_type, event_date, venue_name, venue_address")
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
        .select("id, client_name, client_email, client_phone, event_type, event_date, venue_name, venue_address, contract_total, deposit_amount, balance_due, balance_due_date, deposit_paid")
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
