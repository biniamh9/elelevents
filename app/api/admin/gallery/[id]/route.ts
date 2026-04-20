import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const GALLERY_BUCKET = "gallery";

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

    if (body.category === null || typeof body.category === "string") {
      updates.category = body.category ? String(body.category).trim() : null;
    }

    if (body.sort_order === null || typeof body.sort_order === "number") {
      updates.sort_order = body.sort_order;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("gallery_items")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "gallery.updated",
      summary: "Gallery image updated",
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update gallery item" }, { status: 500 });
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

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("gallery_items")
      .select("id, image_path")
      .eq("id", id)
      .single();

    if (lookupError || !existing) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    if (existing.image_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(GALLERY_BUCKET)
        .remove([existing.image_path]);

      if (storageError) {
        console.error("Failed to remove gallery image from storage:", storageError.message);
      }
    }

    const { error } = await supabaseAdmin
      .from("gallery_items")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "gallery.deleted",
      summary: "Gallery image deleted",
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}
