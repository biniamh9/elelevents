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

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (typeof body.text === "string" && body.text.trim()) {
      updates.text = body.text.trim();
    }

    if (body.image_url === null || typeof body.image_url === "string") {
      updates.image_url = body.image_url ? String(body.image_url).trim() : null;
    }

    if (body.sort_order === null || typeof body.sort_order === "number") {
      updates.sort_order = body.sort_order;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("homepage_process_steps")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "homepage_process.updated",
      summary: "Homepage flow step updated",
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update homepage flow step" },
      { status: 500 }
    );
  }
}
