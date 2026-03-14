import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validations/inquiry";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { estimateEventPrice } from "@/lib/pricing";
import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const estimatedPrice =
      data.estimatedPrice ??
      estimateEventPrice({
        guestCount: data.guestCount,
        eventType: data.eventType,
        serviceCount: data.services.length,
        indoorOutdoor: data.indoorOutdoor,
      });

    const client = await upsertClientByEmail(supabaseAdmin, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      preferredContactMethod: data.preferredContactMethod,
      source: data.referralSource ?? "website_quote_request",
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("event_inquiries")
      .insert({
        client_id: client.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        event_type: data.eventType,
        event_date: data.eventDate || null,
        guest_count: data.guestCount ?? null,
        venue_name: data.venueName || null,
        venue_status: data.venueStatus || null,
        services: data.services ?? [],
        indoor_outdoor: data.indoorOutdoor || null,
        colors_theme: data.colorsTheme || null,
        inspiration_notes: data.inspirationNotes || null,
        additional_info: data.additionalInfo || null,
        requested_vendor_categories: data.requestedVendorCategories ?? [],
        vendor_request_notes: data.vendorRequestNotes || null,
        preferred_contact_method: data.preferredContactMethod || null,
        referral_source: data.referralSource || "website_quote_request",
        needs_delivery_setup: data.needsDeliverySetup ?? false,
        estimated_price: estimatedPrice,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: inserted.id,
      action: "inquiry.created",
      summary: "Quote request submitted from website",
      metadata: {
        client_id: client.id,
        event_type: inserted.event_type,
        estimated_price: inserted.estimated_price,
        requested_vendor_categories: inserted.requested_vendor_categories,
      },
    });

    if (
      resend &&
      process.env.NOTIFICATION_TO_EMAIL &&
      process.env.NOTIFICATION_FROM_EMAIL
    ) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: process.env.NOTIFICATION_FROM_EMAIL,
          to: process.env.NOTIFICATION_TO_EMAIL,
          subject: `New Event Inquiry: ${data.eventType} - ${data.firstName} ${data.lastName}`,
          html: `
            <h2>New Event Inquiry</h2>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Event Type:</strong> ${data.eventType}</p>
            <p><strong>Event Date:</strong> ${data.eventDate || "N/A"}</p>
            <p><strong>Guest Count:</strong> ${data.guestCount ?? "N/A"}</p>
            <p><strong>Venue:</strong> ${data.venueName || "N/A"}</p>
            <p><strong>Estimate:</strong> $${estimatedPrice}</p>
          `,
        });

        if (sendError) {
          console.error("Lead notification email failed:", sendError);
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    return NextResponse.json({ success: true, inserted }, { status: 201 });
  } catch (error) {
    console.error("Route crash:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
