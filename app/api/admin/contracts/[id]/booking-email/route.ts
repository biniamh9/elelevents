import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sendBookingLifecycleEmail, type BookingEmailType } from "@/lib/booking-email";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const allowedTypes: BookingEmailType[] = [
  "deposit_receipt",
  "final_payment_reminder",
  "final_payment_confirmation",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("sales");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();
    const type = body.type as BookingEmailType;

    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    const { data: contract, error } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await sendBookingLifecycleEmail(type, contract);

    if (type === "final_payment_reminder" && contract.inquiry_id) {
      await supabaseAdmin
        .from("event_inquiries")
        .update({ final_payment_reminder_sent_at: new Date().toISOString() })
        .eq("id", contract.inquiry_id);
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: contract.id,
      action: `contract.${type}`,
      summary: `Customer lifecycle email sent: ${type}`,
      metadata: {
        client_email: contract.client_email,
        inquiry_id: contract.inquiry_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send booking email" },
      { status: 500 }
    );
  }
}
