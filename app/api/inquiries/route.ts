import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validations/inquiry";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { estimateEventPrice } from "@/lib/pricing";
import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { canSendConsultationEmail, sendInquiryConfirmationEmail } from "@/lib/consultation-email";
import { buildAdminEventInquiryEmailVariables } from "@/lib/email-template-variables";
import {
  getNotificationFromEmail,
  renderEmailTemplate,
} from "@/lib/email-template-renderer";
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
        vision_board_urls: data.visionBoardUrls ?? [],
        selected_decor_categories: data.selectedDecorCategories ?? [],
        decor_selections: data.decorSelections ?? [],
        additional_info: data.additionalInfo || null,
        requested_vendor_categories: data.requestedVendorCategories ?? [],
        vendor_request_notes: data.vendorRequestNotes || null,
        preferred_contact_method: data.preferredContactMethod || null,
        consultation_request_date: data.consultationPreferenceDate || null,
        consultation_request_time: data.consultationPreferenceTime || null,
        consultation_video_platform: data.consultationVideoPlatform || null,
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
          selected_decor_categories: inserted.selected_decor_categories,
          consultation_request_date: inserted.consultation_request_date,
          consultation_request_time: inserted.consultation_request_time,
        },
    });

    if (resend && process.env.NOTIFICATION_TO_EMAIL) {
      try {
        const fromEmail = getNotificationFromEmail();
        const renderedEmail = renderEmailTemplate(
          "admin_event_inquiry",
          buildAdminEventInquiryEmailVariables({
            customerFullName: `${data.firstName} ${data.lastName}`,
            customerEmail: data.email,
            customerPhone: data.phone,
            eventType: data.eventType,
            eventDate: data.eventDate,
            guestCount: String(data.guestCount ?? "N/A"),
            venueName: data.venueName,
            estimatedValue: estimatedPrice,
          })
        );
        const { error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: process.env.NOTIFICATION_TO_EMAIL,
          subject: renderedEmail.subject,
          html: renderedEmail.html,
        });

        if (sendError) {
          console.error("Lead notification email failed:", sendError);
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    if (canSendConsultationEmail()) {
      try {
        await sendInquiryConfirmationEmail({
          clientName: `${data.firstName} ${data.lastName}`,
          clientEmail: data.email,
          eventType: data.eventType,
          eventDate: data.eventDate || null,
        });

        await supabaseAdmin
          .from("event_inquiries")
          .update({
            consultation_request_confirmation_sent_at: new Date().toISOString(),
          })
          .eq("id", inserted.id);
      } catch (emailError) {
        console.error("Inquiry confirmation email failed:", emailError);
      }
    }

    return NextResponse.json({ success: true, inserted }, { status: 201 });
  } catch (error) {
    console.error("Route crash:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
