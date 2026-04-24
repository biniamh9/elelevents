import { NextResponse } from "next/server";
import { Resend } from "resend";

import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { getNotificationFromEmail, renderBrandedEmail } from "@/lib/email-template-renderer";
import { formatMoney } from "@/lib/rental-shared";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { rentalRequestSchema } from "@/lib/validations/rental-requests";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = rentalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid rental request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const client = await upsertClientByEmail(supabaseAdmin, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      preferredContactMethod: "email",
      source: "website_rental_inquiry",
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("rental_quote_requests")
      .insert({
        client_id: client.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        event_date: data.eventDate,
        venue_name: data.venueName,
        occasion_label: data.occasionLabel,
        guest_count: data.guestCount,
        notes: data.notes,
        include_delivery: data.includeDelivery,
        include_setup: data.includeSetup,
        include_breakdown: data.includeBreakdown,
        rental_subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        setup_fee: data.setupFee,
        breakdown_fee: data.breakdownFee,
        refundable_security_deposit: data.securityDeposit,
        estimated_total: data.total,
        status: "requested",
      })
      .select("*")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || "Failed to create rental request" },
        { status: 500 }
      );
    }

    const requestItems = data.items.map((item) => ({
      rental_request_id: inserted.id,
      rental_item_id: item.rentalItemId,
      item_name: item.name,
      item_slug: item.slug,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      price_type: item.priceType,
      line_subtotal: item.lineSubtotal,
      security_deposit_amount: item.securityDeposit,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("rental_quote_request_items")
      .insert(requestItems);

    if (itemsError) {
      await supabaseAdmin.from("rental_quote_requests").delete().eq("id", inserted.id);
      return NextResponse.json(
        { error: itemsError.message || "Failed to create rental request items" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "rental_request",
      entityId: inserted.id,
      action: "rental_request.created",
      summary: "Rental quote request submitted from website",
      metadata: {
        client_id: client.id,
        items: requestItems.map((item) => ({
          item_name: item.item_name,
          quantity: item.quantity,
          line_subtotal: item.line_subtotal,
        })),
        estimated_total: inserted.estimated_total,
        refundable_security_deposit: inserted.refundable_security_deposit,
      },
    });

    if (resend && process.env.NOTIFICATION_TO_EMAIL) {
      try {
        const fromEmail = getNotificationFromEmail();
        const itemRows = requestItems
          .map(
            (item) =>
              `<tr><td style="padding:0 0 8px;color:#6a5a49;">${item.item_name}</td><td style="padding:0 0 8px;text-align:right;font-weight:700;color:#241d18;">${item.quantity}</td><td style="padding:0 0 8px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(Number(item.line_subtotal))}</td></tr>`
          )
          .join("");

        await resend.emails.send({
          from: fromEmail,
          to: process.env.NOTIFICATION_TO_EMAIL,
          subject: `New Rental Quote Request: ${data.firstName} ${data.lastName}`,
          html: renderBrandedEmail({
            eyebrow: "New Rental Request",
            heading: `${data.firstName} ${data.lastName} requested a rental quote.`,
            intro: "A rental-specific request is ready for review in the rental pipeline.",
            body: `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr><td style="padding:0 0 18px;">
                  <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Client details</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Name</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${data.firstName} ${data.lastName}</td></tr>
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Email</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${data.email}</td></tr>
                      <tr><td style="padding:0;color:#6a5a49;">Phone</td><td style="padding:0;text-align:right;font-weight:700;color:#241d18;">${data.phone}</td></tr>
                    </table>
                  </div>
                </td></tr>
                <tr><td style="padding:0 0 18px;">
                  <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Rental items</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      ${itemRows}
                    </table>
                  </div>
                </td></tr>
                <tr><td>
                  <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Pricing summary</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Rental subtotal</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.subtotal)}</td></tr>
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Delivery</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.deliveryFee)}</td></tr>
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Setup</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.setupFee)}</td></tr>
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Breakdown</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.breakdownFee)}</td></tr>
                      <tr><td style="padding:0 0 10px;color:#6a5a49;">Refundable deposit</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.securityDeposit)}</td></tr>
                      <tr><td style="padding:0;color:#6a5a49;">Estimated total</td><td style="padding:0;text-align:right;font-weight:700;color:#241d18;">${formatMoney(data.total)}</td></tr>
                    </table>
                  </div>
                </td></tr>
              </table>
            `,
            footerNote: "Open Admin > Rentals > Requests to review and move this quote request through the rental pipeline.",
          }),
        });
      } catch (emailError) {
        console.error("Rental request notification failed:", emailError);
      }
    }

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Rental request route failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
