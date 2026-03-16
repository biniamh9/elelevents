import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const activityIds = Array.isArray(body.activityIds)
      ? body.activityIds.filter((value: unknown): value is string => typeof value === "string")
      : [];

    if (!activityIds.length) {
      return NextResponse.json({ error: "No notification ids provided" }, { status: 400 });
    }

    const rows = activityIds.map((activityId) => ({
      admin_id: auth.user!.id,
      activity_id: activityId,
      read_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("admin_notification_reads")
      .upsert(rows, { onConflict: "admin_id,activity_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
