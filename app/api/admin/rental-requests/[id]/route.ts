import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { RENTAL_REQUEST_STATUSES } from "@/lib/validations/rental-requests";

const rentalRequestUpdateSchema = z.object({
  status: z.enum(RENTAL_REQUEST_STATUSES).optional(),
  adminNotes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = rentalRequestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rental request update" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const nextStatus = parsed.data.status;

    if (nextStatus) {
      updates.status = nextStatus;

      if (nextStatus === "quoted") updates.quoted_at = new Date().toISOString();
      if (nextStatus === "reserved") updates.reserved_at = new Date().toISOString();
      if (nextStatus === "completed") updates.completed_at = new Date().toISOString();
      if (nextStatus === "cancelled") updates.cancelled_at = new Date().toISOString();
    }

    if (typeof parsed.data.adminNotes === "string") {
      updates.admin_notes = parsed.data.adminNotes.trim() || null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("rental_quote_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Request not found" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "rental_request",
      entityId: id,
      action: nextStatus ? "rental_request.status_updated" : "rental_request.notes_updated",
      summary: nextStatus
        ? `Rental request moved to ${nextStatus.replace(/_/g, " ")}`
        : "Rental request notes updated",
      metadata: {
        status: nextStatus ?? null,
      },
      actorId: auth.profile?.id ?? null,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Rental request update failed:", error);
    return NextResponse.json({ error: "Failed to update rental request" }, { status: 500 });
  }
}
