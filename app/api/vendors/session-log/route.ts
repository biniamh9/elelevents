import { NextResponse } from "next/server";
import { requireVendorApi } from "@/lib/auth/vendor";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST() {
  try {
    const auth = await requireVendorApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    await logActivity(supabaseAdmin, {
      entityType: "vendor",
      entityId: auth.vendor.id,
      actorId: auth.user.id,
      action: "vendor.signed_in",
      summary: "Vendor signed in",
      metadata: {
        business_name: auth.vendor.business_name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to log vendor session" }, { status: 500 });
  }
}
