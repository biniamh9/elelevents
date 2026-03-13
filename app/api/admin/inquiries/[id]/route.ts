import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const allowedStatuses = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "closed_lost",
];

const allowedConsultationStatuses = [
  "not_scheduled",
  "requested",
  "scheduled",
  "completed",
  "reschedule_needed",
  "no_show",
];

const allowedQuoteResponseStatuses = [
  "not_sent",
  "awaiting_response",
  "accepted",
  "declined",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, client_id, status, quoted_at, booked_at, admin_notes, consultation_status, consultation_type, consultation_at, follow_up_at, quote_response_status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (body.status) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      updates.status = body.status;

      if (body.status === "quoted" && !existing.quoted_at) {
        updates.quoted_at = new Date().toISOString();
      }

      if (body.status === "booked" && !existing.booked_at) {
        updates.booked_at = new Date().toISOString();
      }
    }

    if (typeof body.admin_notes === "string") {
      updates.admin_notes = body.admin_notes;
    }

    if (body.estimated_price === null || typeof body.estimated_price === "number") {
      updates.estimated_price = body.estimated_price;
    }

    if (body.consultation_status) {
      if (!allowedConsultationStatuses.includes(body.consultation_status)) {
        return NextResponse.json({ error: "Invalid consultation status" }, { status: 400 });
      }

      updates.consultation_status = body.consultation_status;
    }

    if (body.consultation_type === null || typeof body.consultation_type === "string") {
      updates.consultation_type = body.consultation_type ? String(body.consultation_type) : null;
    }

    if (body.consultation_at === null || typeof body.consultation_at === "string") {
      updates.consultation_at = body.consultation_at;
    }

    if (body.follow_up_at === null || typeof body.follow_up_at === "string") {
      updates.follow_up_at = body.follow_up_at;
    }

    if (body.quote_response_status) {
      if (!allowedQuoteResponseStatuses.includes(body.quote_response_status)) {
        return NextResponse.json({ error: "Invalid quote response status" }, { status: 400 });
      }

      updates.quote_response_status = body.quote_response_status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("event_inquiries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: data.id,
      action: "inquiry.updated",
      summary: "Inquiry updated from admin CRM",
      metadata: {
        previous_status: existing.status,
        new_status: data.status,
        notes_changed: existing.admin_notes !== data.admin_notes,
        client_id: data.client_id,
        estimated_price: data.estimated_price,
        consultation_status: data.consultation_status,
        consultation_at: data.consultation_at,
        follow_up_at: data.follow_up_at,
        quote_response_status: data.quote_response_status,
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
