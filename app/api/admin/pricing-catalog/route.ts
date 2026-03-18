import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const unitPrice = Number(body.unit_price ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: "Unit price must be a valid non-negative number" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_catalog_items")
      .insert({
        name,
        category: typeof body.category === "string" ? body.category.trim() || null : null,
        variant: typeof body.variant === "string" ? body.variant.trim() || null : null,
        unit_label:
          typeof body.unit_label === "string" && body.unit_label.trim()
            ? body.unit_label.trim()
            : "each",
        unit_price: unitPrice,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        sort_order:
          typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
            ? body.sort_order
            : null,
        is_active: body.is_active !== false,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to create pricing item" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create pricing item" }, { status: 500 });
  }
}
