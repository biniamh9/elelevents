import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { parseRentalDepositRecordFormData } from "@/lib/rental-admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ recordId: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { recordId } = await context.params;
    const formData = await request.formData();
    const values = parseRentalDepositRecordFormData(formData);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("rental_deposit_records")
      .select("id, rental_item_id")
      .eq("id", recordId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Deposit record not found" }, { status: 404 });
    }

    const { data: record, error } = await supabaseAdmin
      .from("rental_deposit_records")
      .update(values)
      .eq("id", recordId)
      .select("*")
      .single();

    if (error || !record) {
      return NextResponse.json({ error: error?.message || "Failed to update deposit record" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: existing.rental_item_id,
      action: "rental.deposit_record.updated",
      summary: "Rental deposit record updated",
      metadata: {
        reference_label: values.reference_label,
        deposit_status: values.deposit_status,
        refund_status: values.refund_status,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch {
    return NextResponse.json({ error: "Failed to update deposit record" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ recordId: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { recordId } = await context.params;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("rental_deposit_records")
      .select("id, rental_item_id, reference_label")
      .eq("id", recordId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Deposit record not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("rental_deposit_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: existing.rental_item_id,
      action: "rental.deposit_record.deleted",
      summary: "Rental deposit record deleted",
      metadata: {
        reference_label: existing.reference_label,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete deposit record" }, { status: 500 });
  }
}
