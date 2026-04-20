import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("overview");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const vendorId = typeof body.vendor_id === "string" ? body.vendor_id : "";
    const category = typeof body.category === "string" ? body.category : "";

    if (!vendorId || !category) {
      return NextResponse.json({ error: "Vendor and category are required" }, { status: 400 });
    }

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, requested_vendor_categories, vendor_request_notes")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendor_accounts")
      .select("id, business_name, approval_status, is_active")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor || vendor.approval_status !== "approved" || !vendor.is_active) {
      return NextResponse.json({ error: "Vendor is not eligible for referrals" }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("vendor_referrals")
      .insert({
        inquiry_id: id,
        vendor_id: vendorId,
        category,
        intro_message: typeof body.intro_message === "string" ? body.intro_message.trim() || null : null,
        fee_amount: typeof body.fee_amount === "number" ? body.fee_amount : 0,
        status: "sent",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message || "Failed to create referral" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "referral",
      entityId: inserted.id,
      actorId: auth.user.id,
      action: "vendor_referral.sent",
      summary: "Vendor referral sent",
      metadata: {
        inquiry_id: id,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        category,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create vendor referral" }, { status: 500 });
  }
}
