import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getDocumentById } from "@/lib/admin-documents";
import {
  calculateDocumentLineTotal,
  calculateDocumentTotals,
  type ClientDocumentLineItem,
} from "@/lib/client-documents";

function normalizeLineItems(items: unknown): ClientDocumentLineItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      if (!title) {
        return null;
      }
      const quantity = Number(row.quantity ?? 0);
      const unitPrice = Number(row.unit_price ?? 0);
      return {
        id: typeof row.id === "string" ? row.id : `local-${index}`,
        document_id: typeof row.document_id === "string" ? row.document_id : null,
        title,
        description: typeof row.description === "string" ? row.description.trim() || null : null,
        quantity,
        unit_price: unitPrice,
        total_price: calculateDocumentLineTotal(quantity, unitPrice),
        display_order: index,
      };
    })
    .filter(Boolean) as ClientDocumentLineItem[];
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const lineItems = normalizeLineItems(body.line_items);
    const totals = calculateDocumentTotals({
      lineItems,
      deliveryFee: Number(body.delivery_fee ?? 0),
      setupFee: Number(body.setup_fee ?? 0),
      discountAmount: Number(body.discount_amount ?? 0),
      taxAmount: Number(body.tax_amount ?? 0),
      amountPaid: Number(body.amount_paid ?? 0),
      depositRequired: Number(body.deposit_required ?? 0),
    });

    const { data: document, error } = await supabaseAdmin
      .from("client_documents")
      .update({
        document_number: body.document_number,
        status: body.send_after_save === true && body.status === "draft" ? "sent" : body.status,
        issue_date: body.issue_date || null,
        due_date: body.due_date || null,
        expiration_date: body.expiration_date || null,
        customer_name: body.customer_name,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone || null,
        event_type: body.event_type || null,
        event_date: body.event_date || null,
        venue_name: body.venue_name || null,
        venue_address: body.venue_address || null,
        notes: body.notes || null,
        inclusions: body.inclusions || null,
        exclusions: body.exclusions || null,
        payment_instructions: body.payment_instructions || null,
        payment_terms: body.payment_terms || null,
        subtotal: totals.subtotal,
        delivery_fee: Number(body.delivery_fee ?? 0),
        setup_fee: Number(body.setup_fee ?? 0),
        discount_amount: Number(body.discount_amount ?? 0),
        tax_amount: Number(body.tax_amount ?? 0),
        total_amount: totals.totalAmount,
        deposit_required: Number(body.deposit_required ?? 0),
        amount_paid: Number(body.amount_paid ?? 0),
        balance_due: totals.balanceDue,
        related_quote_id: body.related_quote_id || null,
        related_invoice_id: body.related_invoice_id || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !document) {
      return NextResponse.json({ error: error?.message || "Failed to update document" }, { status: 500 });
    }

    await supabaseAdmin.from("client_document_line_items").delete().eq("document_id", id);
    if (lineItems.length) {
      const { error: itemsError } = await supabaseAdmin.from("client_document_line_items").insert(
        lineItems.map((item, index) => ({
          document_id: id,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          display_order: index,
        }))
      );
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: id,
      action: "document.updated",
      summary: `${document.document_type} updated`,
      metadata: {
        status: document.status,
        total_amount: document.total_amount,
      },
    });

    const hydrated = await getDocumentById(id);
    return NextResponse.json({
      success: true,
      document,
      lineItems: hydrated?.line_items ?? [],
      payments: hydrated?.payments ?? [],
    });
  } catch (error) {
    console.error("Update document failed:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
