import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (body.category === null || typeof body.category === "string") {
      updates.category = body.category ? String(body.category).trim() || null : null;
    }

    if (body.variant === null || typeof body.variant === "string") {
      updates.variant = body.variant ? String(body.variant).trim() || null : null;
    }

    if (typeof body.unit_label === "string" && body.unit_label.trim()) {
      updates.unit_label = body.unit_label.trim();
    }

    if (body.unit_price !== undefined) {
      const unitPrice = Number(body.unit_price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: "Unit price must be a valid non-negative number" }, { status: 400 });
      }
      updates.unit_price = unitPrice;
    }

    if (body.notes === null || typeof body.notes === "string") {
      updates.notes = body.notes ? String(body.notes).trim() || null : null;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (body.sort_order === null || typeof body.sort_order === "number") {
      updates.sort_order =
        body.sort_order === null || !Number.isFinite(body.sort_order)
          ? null
          : body.sort_order;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_catalog_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to update pricing item" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update pricing item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("pricing_catalog_items")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete pricing item" }, { status: 500 });
  }
}
