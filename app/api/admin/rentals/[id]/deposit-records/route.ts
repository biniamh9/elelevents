import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { parseRentalDepositRecordFormData } from "@/lib/rental-admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const values = parseRentalDepositRecordFormData(formData);

    const { data: record, error } = await supabaseAdmin
      .from("rental_deposit_records")
      .insert({
        rental_item_id: id,
        ...values,
      })
      .select("*")
      .single();

    if (error || !record) {
      return NextResponse.json({ error: error?.message || "Failed to create deposit record" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "rental.deposit_record.created",
      summary: "Rental deposit record created",
      metadata: {
        reference_label: values.reference_label,
        deposit_status: values.deposit_status,
        inspection_status: values.inspection_status,
      },
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create deposit record" }, { status: 500 });
  }
}
