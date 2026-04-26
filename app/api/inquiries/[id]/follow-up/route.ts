import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/crm";
import { normalizeInquiryFollowUpDetails } from "@/lib/inquiry-follow-up";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const followUpSchema = z.object({
  email: z.string().email(),
  inspirationLinks: z.array(z.string().url()).max(10).default([]),
  selectedStyles: z.array(z.string()).max(10).default([]),
  uploadedUrls: z.array(z.string().url()).max(10).default([]),
});

function mergeUrls(existing: string[] | null, next: string[]) {
  return Array.from(new Set([...(existing ?? []), ...next]));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = followUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid follow-up submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedEmail = data.email.trim().toLowerCase();

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, email, vision_board_urls, follow_up_details_json")
      .eq("id", id)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const existingFollowUp = normalizeInquiryFollowUpDetails(inquiry.follow_up_details_json) ?? {};
    const uploadedUrls = mergeUrls(
      mergeUrls(existingFollowUp.uploaded_urls ?? [], inquiry.vision_board_urls ?? []),
      data.uploadedUrls
    );

    const { error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        vision_board_urls: mergeUrls(inquiry.vision_board_urls ?? [], data.uploadedUrls),
        follow_up_details_json: {
          selected_styles: Array.from(
            new Set([...(existingFollowUp.selected_styles ?? []), ...data.selectedStyles])
          ),
          inspiration_links: Array.from(
            new Set([...(existingFollowUp.inspiration_links ?? []), ...data.inspirationLinks])
          ),
          uploaded_urls: uploadedUrls,
          note:
            existingFollowUp.note ??
            "Client added additional inspiration after the initial availability request.",
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
        },
      })
      .eq("id", inquiry.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: inquiry.id,
      action: "inquiry_follow_up_added",
      summary: "Client added inspiration follow-up details.",
      metadata: {
        uploaded_image_count: data.uploadedUrls.length,
        inspiration_link_count: data.inspirationLinks.length,
        selected_styles: data.selectedStyles,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save inquiry follow-up:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
