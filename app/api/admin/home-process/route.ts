import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi("content");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!title || !text) {
      return NextResponse.json(
        { error: "Title and supporting text are required" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("homepage_process_steps")
      .insert({
        title,
        text,
        image_url:
          typeof body.image_url === "string" ? body.image_url.trim() || null : null,
        sort_order: typeof body.sort_order === "number" ? body.sort_order : null,
        is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || "Failed to create homepage flow step" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: inserted.id,
      action: "homepage_process.created",
      summary: "Homepage flow step created",
      metadata: { title },
    });

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create homepage flow step" },
      { status: 500 }
    );
  }
}
