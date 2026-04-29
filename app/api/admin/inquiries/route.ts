import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { buildEventInquiryCreatedActivityEvent } from "@/lib/email-activity-events";
import { buildInquiryConversationKey } from "@/lib/crm-opportunity-identity";
import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { estimateEventPrice } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { inquirySchema } from "@/lib/validations/inquiry";

export async function POST(request: Request) {
  const auth = await requireAdminApi("overview");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid inquiry payload", details: parsed.error.flatten() },
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
      source: data.referralSource ?? "manual_admin_entry",
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
        preferred_contact_method: data.preferredContactMethod || "phone",
        consultation_request_date: data.consultationPreferenceDate || null,
        consultation_request_time: data.consultationPreferenceTime || null,
        consultation_video_platform: data.consultationVideoPlatform || null,
        referral_source: data.referralSource || "manual_admin_entry",
        needs_delivery_setup: data.needsDeliverySetup ?? false,
        estimated_price: estimatedPrice,
        status: "new",
      })
      .select()
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message || "Failed to create inquiry." }, { status: 500 });
    }

    const conversationKey = buildInquiryConversationKey(inserted.id);
    await supabaseAdmin
      .from("event_inquiries")
      .update({ crm_conversation_key: conversationKey })
      .eq("id", inserted.id);

    const activityEvent = buildEventInquiryCreatedActivityEvent({
      clientId: client.id,
      eventType: inserted.event_type,
      estimatedPrice: inserted.estimated_price,
      requestedVendorCategories: inserted.requested_vendor_categories,
      selectedDecorCategories: inserted.selected_decor_categories,
      consultationRequestDate: inserted.consultation_request_date,
      consultationRequestTime: inserted.consultation_request_time,
    });

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: inserted.id,
      ...activityEvent,
      summary: "Manual inquiry entered by admin",
      metadata: {
        ...activityEvent.metadata,
        intake_mode: "manual_admin_entry",
      },
      actorId: auth.user?.id ?? null,
    });

    return NextResponse.json(
      { success: true, inquiry: { ...inserted, crm_conversation_key: conversationKey } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual inquiry creation failed:", error);
    return NextResponse.json({ error: "Failed to create inquiry." }, { status: 500 });
  }
}
