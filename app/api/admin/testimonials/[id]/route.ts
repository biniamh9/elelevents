import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("content");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.reviewer_name === "string" && body.reviewer_name.trim()) {
      updates.reviewer_name = body.reviewer_name.trim();
    }

    if (body.source_label === null || typeof body.source_label === "string") {
      updates.source_label = body.source_label
        ? String(body.source_label).trim()
        : null;
    }

    if (
      typeof body.rating === "number" &&
      Number.isInteger(body.rating) &&
      body.rating >= 1 &&
      body.rating <= 5
    ) {
      updates.rating = body.rating;
    }

    if (typeof body.quote === "string" && body.quote.trim()) {
      updates.quote = body.quote.trim();
    }

    if (body.highlight === null || typeof body.highlight === "string") {
      updates.highlight = body.highlight ? String(body.highlight).trim() : null;
    }

    if (body.event_type === null || typeof body.event_type === "string") {
      updates.event_type = body.event_type ? String(body.event_type).trim() : null;
    }

    if (typeof body.is_featured === "boolean") {
      updates.is_featured = body.is_featured;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (body.sort_order === null || typeof body.sort_order === "number") {
      updates.sort_order = body.sort_order;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("testimonials").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "testimonial.updated",
      summary: "Testimonial updated",
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("content");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "testimonial.deleted",
      summary: "Testimonial deleted",
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
