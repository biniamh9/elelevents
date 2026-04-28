import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { extractUnmatchedReplyId } from "@/lib/unmatched-inbound-replies";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi("overview");
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const activityIds = Array.isArray(body.activityIds)
      ? body.activityIds.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const unmatchedReplyIds = Array.isArray(body.unmatchedReplyIds)
      ? body.unmatchedReplyIds.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const normalizedUnmatchedReplyIds = unmatchedReplyIds
      .map((value) => extractUnmatchedReplyId(value) ?? value)
      .filter(Boolean);

    if (!activityIds.length && !normalizedUnmatchedReplyIds.length) {
      return NextResponse.json({ error: "No notification ids provided" }, { status: 400 });
    }

    const readAt = new Date().toISOString();

    if (activityIds.length) {
      const rows = activityIds.map((activityId) => ({
        admin_id: auth.user!.id,
        activity_id: activityId,
        read_at: readAt,
      }));

      const { error } = await supabaseAdmin
        .from("admin_notification_reads")
        .upsert(rows, { onConflict: "admin_id,activity_id" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (normalizedUnmatchedReplyIds.length) {
      const rows = normalizedUnmatchedReplyIds.map((unmatchedReplyId) => ({
        admin_id: auth.user!.id,
        unmatched_reply_id: unmatchedReplyId,
        read_at: readAt,
      }));

      const { error } = await supabaseAdmin
        .from("admin_unmatched_reply_reads")
        .upsert(rows, { onConflict: "admin_id,unmatched_reply_id" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
