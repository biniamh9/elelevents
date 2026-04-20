import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi("sales");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("packages")
      .insert({
        name,
        best_for: typeof body.best_for === "string" ? body.best_for.trim() || null : null,
        summary: typeof body.summary === "string" ? body.summary.trim() || null : null,
        features: Array.isArray(body.features) ? body.features : [],
        featured: Boolean(body.featured),
        sort_order: typeof body.sort_order === "number" ? body.sort_order : null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || "Failed to create package" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: inserted.id,
      action: "package.created",
      summary: "Package created",
      metadata: { name },
    });

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
