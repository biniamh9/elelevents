import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("sales");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (body.best_for === null || typeof body.best_for === "string") {
      updates.best_for = body.best_for ? String(body.best_for).trim() : null;
    }

    if (body.summary === null || typeof body.summary === "string") {
      updates.summary = body.summary ? String(body.summary).trim() : null;
    }

    if (Array.isArray(body.features)) {
      updates.features = body.features;
    }

    if (typeof body.featured === "boolean") {
      updates.featured = body.featured;
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

    const { error } = await supabaseAdmin
      .from("packages")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "package.updated",
      summary: "Package updated",
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("sales");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "package.deleted",
      summary: "Package deleted",
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
