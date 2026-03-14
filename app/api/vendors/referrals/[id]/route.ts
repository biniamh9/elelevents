import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireVendorApi } from "@/lib/auth/vendor";
import { logActivity } from "@/lib/crm";

const allowedStatuses = ["accepted", "declined"] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireVendorApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const nextStatus = typeof body.status === "string" ? body.status : "";

    if (!allowedStatuses.includes(nextStatus as (typeof allowedStatuses)[number])) {
      return NextResponse.json({ error: "Invalid referral status" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("vendor_referrals")
      .select("id, status, inquiry_id, vendor_id")
      .eq("id", id)
      .eq("vendor_id", auth.vendor.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      status: nextStatus,
    };

    if (nextStatus === "accepted") {
      updates.accepted_at = new Date().toISOString();
    }

    if (nextStatus === "declined") {
      updates.declined_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("vendor_referrals")
      .update(updates)
      .eq("id", id)
      .eq("vendor_id", auth.vendor.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "referral",
      entityId: existing.id,
      actorId: auth.user.id,
      action: `vendor_referral.${nextStatus}`,
      summary: `Vendor ${nextStatus} referral`,
      metadata: {
        inquiry_id: existing.inquiry_id,
        vendor_id: existing.vendor_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
