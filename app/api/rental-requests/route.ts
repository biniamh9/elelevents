import { NextResponse } from "next/server";
import { Resend } from "resend";

import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { buildAdminRentalRequestEmailVariables } from "@/lib/email-template-variables";
import {
  getNotificationFromEmail,
  renderEmailPricingSummarySection,
  renderEmailTemplate,
  renderRentalRequestItemsSection,
} from "@/lib/email-template-renderer";
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
        const renderedEmail = renderEmailTemplate(
          "admin_rental_request",
          buildAdminRentalRequestEmailVariables({
            customerFullName: `${data.firstName} ${data.lastName}`,
            customerEmail: data.email,
            customerPhone: data.phone,
            rentalItemsHtml: renderRentalRequestItemsSection(
              requestItems.map((item) => ({
                item_name: item.item_name,
                quantity: item.quantity,
                line_subtotal: Number(item.line_subtotal),
              }))
            ),
            pricingSummaryHtml: renderEmailPricingSummarySection("Pricing summary", [
              { label: "Rental subtotal", value: data.subtotal },
              { label: "Delivery", value: data.deliveryFee },
              { label: "Setup", value: data.setupFee },
              { label: "Breakdown", value: data.breakdownFee },
              { label: "Refundable deposit", value: data.securityDeposit },
              { label: "Estimated total", value: data.total },
            ]),
          })
        );
        await resend.emails.send({
          from: fromEmail,
          to: process.env.NOTIFICATION_TO_EMAIL,
          subject: renderedEmail.subject,
          html: renderedEmail.html,
          text: renderedEmail.text,
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
