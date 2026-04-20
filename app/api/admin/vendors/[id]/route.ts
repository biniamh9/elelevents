import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { VENDOR_APPROVAL_STATUSES, VENDOR_MEMBERSHIP_STATUSES } from "@/lib/vendors";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("operations");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.approval_status === "string" && VENDOR_APPROVAL_STATUSES.includes(body.approval_status)) {
      updates.approval_status = body.approval_status;
    }

    if (typeof body.membership_status === "string" && VENDOR_MEMBERSHIP_STATUSES.includes(body.membership_status)) {
      updates.membership_status = body.membership_status;
    }

    if (typeof body.default_referral_fee === "number") {
      updates.default_referral_fee = body.default_referral_fee;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (typeof body.admin_notes === "string") {
      updates.admin_notes = body.admin_notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("vendor_accounts")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "vendor",
      entityId: id,
      actorId: auth.user.id,
      action: "vendor.updated",
      summary: "Vendor account updated",
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
