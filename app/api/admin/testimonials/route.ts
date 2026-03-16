import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const reviewerName =
      typeof body.reviewer_name === "string" ? body.reviewer_name.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";

    if (!reviewerName || !quote) {
      return NextResponse.json(
        { error: "Reviewer name and quote are required" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("testimonials")
      .insert({
        reviewer_name: reviewerName,
        source_label:
          typeof body.source_label === "string"
            ? body.source_label.trim() || "Google review"
            : "Google review",
        rating:
          typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
            ? body.rating
            : 5,
        quote,
        highlight:
          typeof body.highlight === "string" ? body.highlight.trim() || null : null,
        event_type:
          typeof body.event_type === "string" ? body.event_type.trim() || null : null,
        is_featured: Boolean(body.is_featured),
        sort_order: typeof body.sort_order === "number" ? body.sort_order : null,
        is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || "Failed to create testimonial" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: inserted.id,
      action: "testimonial.created",
      summary: "Testimonial created",
      metadata: { reviewerName },
    });

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
