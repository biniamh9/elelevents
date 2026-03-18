import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import {
  calculateLineTotal,
  calculateQuoteTotals,
  DEFAULT_BASE_FEE,
} from "@/lib/admin-pricing";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PUT(
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

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, client_id, estimated_price")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const pricingInput = {
      base_fee: Math.max(Number(body.base_fee ?? DEFAULT_BASE_FEE), 0),
      discount_amount: Math.max(Number(body.discount_amount ?? 0), 0),
      delivery_fee: Math.max(Number(body.delivery_fee ?? 0), 0),
      labor_adjustment: Number(body.labor_adjustment ?? 0),
      tax_amount: Math.max(Number(body.tax_amount ?? 0), 0),
      manual_total_override:
        body.manual_total_override === null || body.manual_total_override === ""
          ? null
          : Number(body.manual_total_override),
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    };

    const lineItems = Array.isArray(body.line_items)
      ? body.line_items
          .map((item: Record<string, unknown>, index: number) => {
            const itemName =
              typeof item.item_name === "string" ? item.item_name.trim() : "";
            if (!itemName) {
              return null;
            }

            const unitPrice = Math.max(Number(item.unit_price ?? 0), 0);
            const quantity = Math.max(Number(item.quantity ?? 0), 0);

            return {
              id: typeof item.id === "string" ? item.id : null,
              inquiry_id: id,
              pricing_catalog_item_id:
                typeof item.pricing_catalog_item_id === "string"
                  ? item.pricing_catalog_item_id
                  : null,
              item_name: itemName,
              category:
                typeof item.category === "string" ? item.category.trim() || null : null,
              variant:
                typeof item.variant === "string" ? item.variant.trim() || null : null,
              unit_label:
                typeof item.unit_label === "string" && item.unit_label.trim()
                  ? item.unit_label.trim()
                  : "each",
              unit_price: unitPrice,
              quantity,
              line_total: calculateLineTotal(unitPrice, quantity),
              notes: typeof item.notes === "string" ? item.notes.trim() || null : null,
              sort_order:
                typeof item.sort_order === "number" && Number.isFinite(item.sort_order)
                  ? item.sort_order
                  : index,
              is_custom: Boolean(item.is_custom),
            };
          })
          .filter(Boolean)
      : [];

    const totals = calculateQuoteTotals(pricingInput, lineItems);

    const { error: pricingError } = await supabaseAdmin
      .from("inquiry_quote_pricing")
      .upsert({
        inquiry_id: id,
        ...pricingInput,
      });

    if (pricingError) {
      return NextResponse.json({ error: pricingError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("inquiry_quote_line_items")
      .delete()
      .eq("inquiry_id", id);

    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabaseAdmin
        .from("inquiry_quote_line_items")
        .insert(lineItems);

      if (lineItemsError) {
        return NextResponse.json({ error: lineItemsError.message }, { status: 500 });
      }
    }

    const inquiryStatusUpdate: Record<string, unknown> = {
      estimated_price: totals.grandTotal,
    };

    if (body.mark_as_quoted === true) {
      inquiryStatusUpdate.status = "quoted";
      inquiryStatusUpdate.quoted_at = new Date().toISOString();
    }

    const { data: updatedInquiry, error: inquiryUpdateError } = await supabaseAdmin
      .from("event_inquiries")
      .update(inquiryStatusUpdate)
      .eq("id", id)
      .select("id, estimated_price, status, quoted_at")
      .single();

    if (inquiryUpdateError || !updatedInquiry) {
      return NextResponse.json(
        { error: inquiryUpdateError?.message || "Failed to update inquiry total" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      action: "inquiry.quote_pricing_saved",
      summary: "Itemized quote pricing updated",
      metadata: {
        client_id: inquiry.client_id,
        previous_estimated_price: inquiry.estimated_price,
        estimated_price: updatedInquiry.estimated_price,
        line_item_count: lineItems.length,
        base_fee: pricingInput.base_fee,
      },
    });

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
      totals,
    });
  } catch (error) {
    console.error("Failed to save itemized quote pricing:", error);
    return NextResponse.json({ error: "Failed to save quote pricing" }, { status: 500 });
  }
}
