import { NextResponse } from "next/server";

import { logActivity } from "@/lib/crm";
import { normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, follow_up_details_json")
      .eq("id", id)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const followUp = normalizeInquiryFollowUpDetails(inquiry.follow_up_details_json);

    if (!followUp) {
      return NextResponse.json({ error: "No follow-up inspiration exists on this inquiry." }, { status: 400 });
    }

    const reviewedAt = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        follow_up_details_json: {
          ...followUp,
          reviewed_at: reviewedAt,
        },
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      action: "inquiry_follow_up_reviewed",
      summary: "Post-submission inspiration was reviewed.",
      metadata: { reviewed_at: reviewedAt },
    });

    return NextResponse.json({ success: true, reviewedAt });
  } catch (error) {
    console.error("Failed to mark inquiry follow-up reviewed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
