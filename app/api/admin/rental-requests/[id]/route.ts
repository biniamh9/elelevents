import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { getNotificationFromEmail } from "@/lib/email-template-renderer";
import {
  calculateRentalChairQuote,
  formatDeliveryFeeLabel,
  RENTAL_REFUNDABLE_DEPOSIT_NOTE,
} from "@/lib/rental-quote-pricing";
import { formatMoney } from "@/lib/rental-shared";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { RENTAL_REQUEST_STATUSES } from "@/lib/validations/rental-requests";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const rentalRequestUpdateSchema = z.object({
  status: z.enum(RENTAL_REQUEST_STATUSES).optional(),
  adminNotes: z.string().optional(),
  action: z.enum(["generate_quote", "send_quote", "mark_paid", "mark_completed"]).optional(),
  distanceMiles: z.number().min(0).optional().nullable(),
  chairUnitPrice: z.number().min(0).optional(),
  quoteNotes: z.string().optional().nullable(),
});

export async function PATCH(
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
    const parsed = rentalRequestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rental request update" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const nextStatus = parsed.data.status;
    let activityAction = nextStatus ? "rental_request.status_updated" : "rental_request.notes_updated";
    let activitySummary = nextStatus
      ? `Rental request moved to ${nextStatus.replace(/_/g, " ")}`
      : "Rental request notes updated";

    if (nextStatus) {
      updates.status = nextStatus;

      if (nextStatus === "quoted") updates.quoted_at = new Date().toISOString();
      if (nextStatus === "accepted") updates.reserved_at = new Date().toISOString();
      if (nextStatus === "paid") updates.reserved_at = new Date().toISOString();
      if (nextStatus === "reserved") updates.reserved_at = new Date().toISOString();
      if (nextStatus === "completed") updates.completed_at = new Date().toISOString();
      if (nextStatus === "cancelled") updates.cancelled_at = new Date().toISOString();
    }

    if (typeof parsed.data.adminNotes === "string") {
      updates.admin_notes = parsed.data.adminNotes.trim() || null;
    }

    if (parsed.data.action === "generate_quote") {
      const { data: rentalRequest, error: requestError } = await supabaseAdmin
        .from("rental_quote_requests")
        .select("*")
        .eq("id", id)
        .single();
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("rental_quote_request_items")
        .select("*")
        .eq("rental_request_id", id);

      if (requestError || !rentalRequest || itemsError) {
        return NextResponse.json({ error: requestError?.message || itemsError?.message || "Request not found" }, { status: 500 });
      }

      const chairQuantity = (items ?? []).reduce(
        (sum, item) => sum + Math.max(Math.trunc(Number(item.quantity ?? 0)), 0),
        0
      );
      if (chairQuantity <= 0) {
        return NextResponse.json({ error: "Chair quantity must be greater than 0" }, { status: 400 });
      }

      const fallbackUnitPrice =
        chairQuantity > 0
          ? Number(rentalRequest.rental_subtotal ?? 0) / chairQuantity
          : 0;
      const pricing = calculateRentalChairQuote({
        chairQuantity,
        chairUnitPrice: parsed.data.chairUnitPrice ?? fallbackUnitPrice,
        distanceMiles: parsed.data.distanceMiles ?? null,
        deliveryRequired: Boolean(rentalRequest.include_delivery),
        setupRequired: Boolean(rentalRequest.include_setup),
        breakdownRequired: Boolean(rentalRequest.include_breakdown),
      });

      const quoteNotes = [
        parsed.data.quoteNotes?.trim() || null,
        pricing.quoteNotes || RENTAL_REFUNDABLE_DEPOSIT_NOTE,
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error: quoteError } = await supabaseAdmin
        .from("rental_quotes")
        .upsert(
          {
            rental_request_id: id,
            chair_quantity: pricing.chairQuantity,
            chair_unit_price: pricing.chairUnitPrice,
            chair_subtotal: pricing.chairSubtotal,
            distance_miles: pricing.distanceMiles,
            delivery_fee: pricing.deliveryFee,
            delivery_custom_quote_required: pricing.deliveryCustomQuoteRequired,
            setup_fee: pricing.setupFee,
            breakdown_fee: pricing.breakdownFee,
            refundable_deposit: pricing.refundableDeposit,
            total_quote: pricing.totalQuote,
            quote_notes: quoteNotes,
            status: "draft",
          },
          { onConflict: "rental_request_id" }
        );

      if (quoteError) {
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
      }

      updates.distance_miles = pricing.distanceMiles;
      updates.delivery_fee = pricing.deliveryFee;
      updates.delivery_custom_quote_required = pricing.deliveryCustomQuoteRequired;
      updates.setup_fee = pricing.setupFee;
      updates.breakdown_fee = pricing.breakdownFee;
      updates.refundable_security_deposit = pricing.refundableDeposit;
      updates.estimated_total = pricing.totalQuote;
      updates.status = "reviewing";
      activityAction = "rental_quote.generated";
      activitySummary = "Rental quote generated";
    }

    if (parsed.data.action === "send_quote") {
      const now = new Date().toISOString();
      const { data: rentalRequest, error: requestError } = await supabaseAdmin
        .from("rental_quote_requests")
        .select("*")
        .eq("id", id)
        .single();
      const { data: quote, error: quoteLookupError } = await supabaseAdmin
        .from("rental_quotes")
        .select("*")
        .eq("rental_request_id", id)
        .maybeSingle();

      if (requestError || !rentalRequest || quoteLookupError || !quote) {
        return NextResponse.json(
          { error: requestError?.message || quoteLookupError?.message || "Generate a rental quote before sending it." },
          { status: 500 }
        );
      }
      if (!rentalRequest.email) {
        return NextResponse.json({ error: "Customer email is required before sending a rental quote." }, { status: 400 });
      }
      if (!resend) {
        return NextResponse.json({ error: "RESEND_API_KEY is not configured." }, { status: 500 });
      }

      const fromEmail = getNotificationFromEmail();
      const deliveryLabel = formatDeliveryFeeLabel({
        delivery_fee: Number(quote.delivery_fee ?? 0),
        delivery_custom_quote_required: Boolean(quote.delivery_custom_quote_required),
      });
      const customerName = `${rentalRequest.first_name ?? ""} ${rentalRequest.last_name ?? ""}`.trim() || "there";
      const emailHtml = `
        <div style="font-family: Georgia, serif; color: #182033; line-height: 1.55;">
          <p style="letter-spacing: .12em; text-transform: uppercase; color: #c46a24; font-weight: 700;">Elel Events & Design</p>
          <h1 style="margin: 0 0 12px;">Your rental quote is ready</h1>
          <p>Hello ${customerName},</p>
          <p>Thank you for submitting your chair rental request. Here is the reviewed quote for your event.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Chair quantity</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${quote.chair_quantity}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Chair rental subtotal</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(Number(quote.chair_subtotal ?? 0))}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Mileage delivery</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${deliveryLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Setup</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(Number(quote.setup_fee ?? 0))}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Breakdown / pickup</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(Number(quote.breakdown_fee ?? 0))}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Refundable deposit</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(Number(quote.refundable_deposit ?? 0))}</td></tr>
              <tr><td style="padding: 12px 8px; font-weight: 700;">Total quote</td><td style="padding: 12px 8px; text-align: right; font-weight: 700;">${formatMoney(Number(quote.total_quote ?? 0))}</td></tr>
            </tbody>
          </table>
          <p>${String(quote.quote_notes ?? RENTAL_REFUNDABLE_DEPOSIT_NOTE).replace(/\n/g, "<br />")}</p>
          <p>Reply to this email and our team will help confirm next steps.</p>
        </div>
      `;

      const { error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: rentalRequest.email,
        subject: "Your Elel Events chair rental quote",
        html: emailHtml,
      });

      if (sendError) {
        return NextResponse.json({ error: sendError.message || "Rental quote email failed to send." }, { status: 500 });
      }

      const { error: quoteError } = await supabaseAdmin
        .from("rental_quotes")
        .update({ status: "sent", sent_at: now })
        .eq("rental_request_id", id);
      if (quoteError) {
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
      }
      updates.status = "quoted";
      updates.quoted_at = now;
      activityAction = "rental_quote.sent";
      activitySummary = "Rental quote marked sent to customer";
    }

    if (parsed.data.action === "mark_paid") {
      const now = new Date().toISOString();
      const { error: quoteError } = await supabaseAdmin
        .from("rental_quotes")
        .update({ status: "paid", paid_at: now })
        .eq("rental_request_id", id);
      if (quoteError) {
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
      }
      updates.status = "paid";
      updates.reserved_at = now;
      activityAction = "rental_quote.paid";
      activitySummary = "Rental quote marked paid";
    }

    if (parsed.data.action === "mark_completed") {
      const now = new Date().toISOString();
      const { error: quoteError } = await supabaseAdmin
        .from("rental_quotes")
        .update({ status: "completed", completed_at: now })
        .eq("rental_request_id", id);
      if (quoteError) {
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
      }
      updates.status = "completed";
      updates.completed_at = now;
      activityAction = "rental_quote.completed";
      activitySummary = "Rental quote marked completed";
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("rental_quote_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Request not found" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "rental_request",
      entityId: id,
      action: activityAction,
      summary: activitySummary,
      metadata: {
        status: nextStatus ?? null,
        action: parsed.data.action ?? null,
      },
      actorId: auth.profile?.id ?? null,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Rental request update failed:", error);
    return NextResponse.json({ error: "Failed to update rental request" }, { status: 500 });
  }
}
