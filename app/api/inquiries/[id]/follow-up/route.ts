import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const followUpSchema = z.object({
  email: z.string().email(),
  inspirationLinks: z.array(z.string().url()).max(10).default([]),
  selectedStyles: z.array(z.string()).max(10).default([]),
  uploadedUrls: z.array(z.string().url()).max(10).default([]),
});

function appendSection(existing: string | null, label: string, value: string | null) {
  if (!value) {
    return existing;
  }

  const prefix = existing?.trim() ? `${existing.trim()}\n\n` : "";
  return `${prefix}${label}: ${value}`;
}

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
      .select("id, email, inspiration_notes, additional_info, vision_board_urls")
      .eq("id", id)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const stylesValue = data.selectedStyles.length ? data.selectedStyles.join(", ") : null;
    const linksValue = data.inspirationLinks.length ? data.inspirationLinks.join("\n") : null;

    const nextInspirationNotes = appendSection(
      appendSection(inquiry.inspiration_notes ?? null, "Style direction", stylesValue),
      "Inspiration links",
      linksValue
    );

    const nextAdditionalInfo = appendSection(
      inquiry.additional_info ?? null,
      "Follow-up",
      "Client added additional inspiration after the initial availability request."
    );

    const { error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        inspiration_notes: nextInspirationNotes,
        additional_info: nextAdditionalInfo,
        vision_board_urls: mergeUrls(inquiry.vision_board_urls ?? [], data.uploadedUrls),
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
