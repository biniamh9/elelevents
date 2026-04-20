import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { buildDocumentNumber, calculateDocumentTotals } from "@/lib/client-documents";
import { getDocumentById, getDocumentCount } from "@/lib/admin-documents";

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
    const invoice = await getDocumentById(id);

    if (!invoice || invoice.document_type !== "invoice") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const { error: paymentError } = await supabaseAdmin
      .from("client_document_payments")
      .insert({
        document_id: id,
        payment_date: body.payment_date,
        amount,
        payment_method: body.payment_method || null,
        reference_number: body.reference_number || null,
        notes: body.notes || null,
      });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    const nextAmountPaid = Number((invoice.amount_paid + amount).toFixed(2));
    const totals = calculateDocumentTotals({
      lineItems: invoice.line_items,
      deliveryFee: invoice.delivery_fee,
      setupFee: invoice.setup_fee,
      discountAmount: invoice.discount_amount,
      taxAmount: invoice.tax_amount,
      amountPaid: nextAmountPaid,
      depositRequired: invoice.deposit_required,
    });

    const nextStatus =
      totals.balanceDue <= 0 ? "paid" : nextAmountPaid > 0 ? "partially_paid" : "unpaid";

    await supabaseAdmin
      .from("client_documents")
      .update({
        amount_paid: nextAmountPaid,
        balance_due: totals.balanceDue,
        status: nextStatus,
      })
      .eq("id", id);

    const receiptCount = await getDocumentCount("receipt");
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("client_documents")
      .insert({
        inquiry_id: invoice.inquiry_id,
        contract_id: invoice.contract_id,
        document_type: "receipt",
        document_number: buildDocumentNumber("receipt", receiptCount),
        status: "paid",
        issue_date: body.payment_date,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        event_type: invoice.event_type,
        event_date: invoice.event_date,
        venue_name: invoice.venue_name,
        venue_address: invoice.venue_address,
        notes: "Payment confirmed and recorded.",
        subtotal: invoice.subtotal,
        delivery_fee: invoice.delivery_fee,
        setup_fee: invoice.setup_fee,
        discount_amount: invoice.discount_amount,
        tax_amount: invoice.tax_amount,
        total_amount: amount,
        deposit_required: invoice.deposit_required,
        amount_paid: amount,
        balance_due: totals.balanceDue,
        related_quote_id: invoice.related_quote_id,
        related_invoice_id: invoice.id,
      })
      .select("*")
      .single();

    if (!receiptError && receipt) {
      if (invoice.line_items.length) {
        await supabaseAdmin.from("client_document_line_items").insert(
          invoice.line_items.map((item, index) => ({
            document_id: receipt.id,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            display_order: index,
          }))
        );
      }

      await supabaseAdmin.from("client_document_payments").insert({
        document_id: receipt.id,
        payment_date: body.payment_date,
        amount,
        payment_method: body.payment_method || null,
        reference_number: body.reference_number || null,
        notes: body.notes || null,
      });
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: id,
      action: "document.payment_recorded",
      summary: "Payment recorded against invoice",
      metadata: {
        amount,
        payment_method: body.payment_method || null,
        receipt_id: receipt?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error("Record payment failed:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
