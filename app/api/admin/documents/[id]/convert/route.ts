import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { buildSeedDocument, getDocumentById, getDocumentCount } from "@/lib/admin-documents";
import { buildDocumentNumber, type ClientDocumentType } from "@/lib/client-documents";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const targetType = body.target_type as ClientDocumentType;
    if (!targetType || !["invoice", "receipt"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    const source = await getDocumentById(id);
    if (!source) {
      return NextResponse.json({ error: "Source document not found" }, { status: 404 });
    }

    const seed = await buildSeedDocument({
      type: targetType,
      inquiryId: source.inquiry_id,
      contractId: source.contract_id,
      sourceDocumentId: id,
    });
    const count = await getDocumentCount(targetType);
    const documentNumber = buildDocumentNumber(targetType, count);

    const { data: document, error } = await supabaseAdmin
      .from("client_documents")
      .insert({
        inquiry_id: seed.inquiry_id,
        contract_id: seed.contract_id,
        document_type: targetType,
        document_number: documentNumber,
        issue_date: seed.issue_date,
        due_date: seed.due_date,
        expiration_date: seed.expiration_date,
        customer_name: seed.customer_name,
        customer_email: seed.customer_email,
        customer_phone: seed.customer_phone,
        event_type: seed.event_type,
        event_date: seed.event_date,
        venue_name: seed.venue_name,
        venue_address: seed.venue_address,
        notes: seed.notes,
        inclusions: seed.inclusions,
        exclusions: seed.exclusions,
        payment_instructions: seed.payment_instructions,
        payment_terms: seed.payment_terms,
        subtotal: seed.subtotal,
        delivery_fee: seed.delivery_fee,
        setup_fee: seed.setup_fee,
        discount_amount: seed.discount_amount,
        tax_amount: seed.tax_amount,
        total_amount: seed.total_amount,
        deposit_required: seed.deposit_required,
        amount_paid: seed.amount_paid,
        balance_due: seed.balance_due,
        status: targetType === "receipt" ? "paid" : "unpaid",
        related_quote_id:
          targetType === "invoice"
            ? source.document_type === "quote"
              ? source.id
              : source.related_quote_id
            : seed.related_quote_id,
        related_invoice_id:
          targetType === "receipt"
            ? source.document_type === "invoice"
              ? source.id
              : source.related_invoice_id
            : null,
      })
      .select("*")
      .single();

    if (error || !document) {
      return NextResponse.json({ error: error?.message || "Failed to convert document" }, { status: 500 });
    }

    if (seed.line_items.length) {
      await supabaseAdmin.from("client_document_line_items").insert(
        seed.line_items.map((item, index) => ({
          document_id: document.id,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          display_order: index,
        }))
      );
    }

    if (targetType === "receipt" && source.document_type === "invoice") {
      const payments = await supabaseAdmin
        .from("client_document_payments")
        .select("*")
        .eq("document_id", source.id)
        .order("payment_date", { ascending: false });
      if (payments.data?.length) {
        await supabaseAdmin.from("client_document_payments").insert(
          payments.data.map((payment) => ({
            document_id: document.id,
            payment_date: payment.payment_date,
            amount: payment.amount,
            payment_method: payment.payment_method,
            reference_number: payment.reference_number,
            notes: payment.notes,
          }))
        );
      }
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: document.id,
      action: "document.converted",
      summary: `${source.document_type} converted to ${targetType}`,
      metadata: {
        source_document_id: id,
        target_type: targetType,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Convert document failed:", error);
    return NextResponse.json({ error: "Failed to convert document" }, { status: 500 });
  }
}
