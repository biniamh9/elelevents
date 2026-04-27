import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { BOOKING_STAGES } from "@/lib/booking-lifecycle";
import { canSendConsultationEmail, sendConsultationScheduledEmails } from "@/lib/consultation-email";
import {
  CRM_LEAD_TEMPERATURES,
  CRM_LOST_REASONS,
  isCrmLeadTemperature,
  isCrmLostReason,
} from "@/lib/crm-options";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

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
  "under_review",
  "approved",
  "scheduled",
  "completed",
  "reschedule_needed",
  "no_show",
];

const allowedQuoteResponseStatuses = [
  "not_sent",
  "awaiting_response",
  "accepted",
  "changes_requested",
  "declined",
];

export async function PATCH(
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

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, client_id, first_name, last_name, email, phone, event_type, event_date, status, quoted_at, booked_at, admin_notes, consultation_status, consultation_type, consultation_at, consultation_location, consultation_video_link, consultation_admin_notes, follow_up_at, quote_response_status, requested_vendor_categories, vendor_request_notes, booking_stage, floor_plan_received, walkthrough_completed, reserved_at, completed_at, booking_confirmed_at, final_payment_reminder_sent_at, consultation_schedule_email_signature, crm_owner, lost_reason, crm_next_action, crm_next_action_due_at, crm_lead_score, crm_lead_temperature, crm_lost_at, crm_lost_context")
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

    if (body.crm_owner === null || typeof body.crm_owner === "string") {
      const owner = typeof body.crm_owner === "string" ? body.crm_owner.trim() : "";
      updates.crm_owner = owner || null;
    }

    if (body.crm_next_action === null || typeof body.crm_next_action === "string") {
      const nextAction =
        typeof body.crm_next_action === "string" ? body.crm_next_action.trim() : "";
      updates.crm_next_action = nextAction || null;
    }

    if (body.crm_next_action_due_at === null || typeof body.crm_next_action_due_at === "string") {
      updates.crm_next_action_due_at = body.crm_next_action_due_at;
    }

    if (body.crm_lead_score === null || typeof body.crm_lead_score === "number") {
      if (body.crm_lead_score === null) {
        updates.crm_lead_score = null;
      } else if (
        Number.isFinite(body.crm_lead_score) &&
        body.crm_lead_score >= 0 &&
        body.crm_lead_score <= 100
      ) {
        updates.crm_lead_score = Math.round(body.crm_lead_score);
      } else {
        return NextResponse.json(
          { error: "Lead score must be a number between 0 and 100." },
          { status: 400 }
        );
      }
    }

    if (body.crm_lead_temperature === null || typeof body.crm_lead_temperature === "string") {
      const normalizedTemperature =
        typeof body.crm_lead_temperature === "string"
          ? body.crm_lead_temperature.trim().toLowerCase()
          : null;

      if (normalizedTemperature === null || normalizedTemperature === "") {
        updates.crm_lead_temperature = null;
      } else if (isCrmLeadTemperature(normalizedTemperature)) {
        updates.crm_lead_temperature = normalizedTemperature;
      } else {
        return NextResponse.json(
          { error: `Invalid lead temperature. Allowed values: ${CRM_LEAD_TEMPERATURES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (body.estimated_price === null || typeof body.estimated_price === "number") {
      updates.estimated_price = body.estimated_price;
    }

    if (body.consultation_status) {
      if (!allowedConsultationStatuses.includes(body.consultation_status)) {
        return NextResponse.json({ error: "Invalid consultation status" }, { status: 400 });
      }

      updates.consultation_status = body.consultation_status;

      if (
        !body.booking_stage &&
        ["approved", "scheduled", "completed", "reschedule_needed"].includes(body.consultation_status) &&
        (!existing.booking_stage || existing.booking_stage === "inquiry")
      ) {
        updates.booking_stage = "consultation_scheduled";
      }
    }

    if (body.consultation_type === null || typeof body.consultation_type === "string") {
      updates.consultation_type = body.consultation_type ? String(body.consultation_type) : null;
    }

    if (body.consultation_at === null || typeof body.consultation_at === "string") {
      updates.consultation_at = body.consultation_at;
    }

    if (body.consultation_location === null || typeof body.consultation_location === "string") {
      updates.consultation_location = body.consultation_location ? String(body.consultation_location) : null;
    }

    if (body.consultation_video_link === null || typeof body.consultation_video_link === "string") {
      updates.consultation_video_link = body.consultation_video_link ? String(body.consultation_video_link) : null;
    }

    if (body.consultation_admin_notes === null || typeof body.consultation_admin_notes === "string") {
      updates.consultation_admin_notes = body.consultation_admin_notes ? String(body.consultation_admin_notes) : null;
    }

    if (body.follow_up_at === null || typeof body.follow_up_at === "string") {
      updates.follow_up_at = body.follow_up_at;
    }

    if (body.quote_response_status) {
      if (!allowedQuoteResponseStatuses.includes(body.quote_response_status)) {
        return NextResponse.json({ error: "Invalid quote response status" }, { status: 400 });
      }

      updates.quote_response_status = body.quote_response_status;

      if (
        !body.booking_stage &&
        body.quote_response_status === "awaiting_response" &&
        (!existing.booking_stage ||
          existing.booking_stage === "inquiry" ||
          existing.booking_stage === "consultation_scheduled")
      ) {
        updates.booking_stage = "quote_sent";
      }
    }

    const nextStatus = updates.status ?? existing.status;

    if (body.lost_reason === null || typeof body.lost_reason === "string") {
      const normalizedLostReason =
        typeof body.lost_reason === "string" ? body.lost_reason.trim() : null;

      if (normalizedLostReason === null || normalizedLostReason === "") {
        updates.lost_reason = null;
      } else {
        if (nextStatus !== "closed_lost") {
          return NextResponse.json(
            { error: "Lost reason can only be set when the inquiry is closed lost." },
            { status: 400 }
          );
        }

        if (!isCrmLostReason(normalizedLostReason)) {
          return NextResponse.json(
            { error: `Invalid lost reason. Allowed values: ${CRM_LOST_REASONS.join(", ")}` },
            { status: 400 }
          );
        }

        updates.lost_reason = normalizedLostReason;
      }
    } else if (nextStatus !== "closed_lost" && existing.lost_reason) {
      updates.lost_reason = null;
    }

    if (nextStatus !== "closed_lost" && existing.lost_reason && body.lost_reason === undefined) {
      updates.lost_reason = null;
    }

    if (body.crm_lost_context === null || typeof body.crm_lost_context === "string") {
      const lostContext =
        typeof body.crm_lost_context === "string" ? body.crm_lost_context.trim() : "";
      updates.crm_lost_context = lostContext || null;
    }

    if (nextStatus === "closed_lost") {
      updates.crm_lost_at =
        body.crm_lost_at === null || typeof body.crm_lost_at === "string"
          ? body.crm_lost_at || existing.crm_lost_at || new Date().toISOString()
          : existing.crm_lost_at || new Date().toISOString();
    } else {
      updates.crm_lost_at = null;
      if (body.crm_lost_context === undefined && existing.crm_lost_context) {
        updates.crm_lost_context = null;
      }
    }

    if (body.booking_stage) {
      if (!BOOKING_STAGES.includes(body.booking_stage)) {
        return NextResponse.json({ error: "Invalid booking stage" }, { status: 400 });
      }

      updates.booking_stage = body.booking_stage;

      if (body.booking_stage === "reserved" && !existing.reserved_at) {
        updates.reserved_at = new Date().toISOString();
      }

      if (body.booking_stage === "completed" && !existing.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      if (body.booking_stage !== "completed") {
        updates.completed_at = body.completed_at === null ? null : updates.completed_at;
      }

      if ((body.booking_stage === "reserved" || body.booking_stage === "signed_deposit_paid") && !existing.booking_confirmed_at) {
        updates.booking_confirmed_at = new Date().toISOString();
      }

      if (body.booking_stage === "reserved" && existing.status !== "booked") {
        updates.status = "booked";
        if (!existing.booked_at) {
          updates.booked_at = new Date().toISOString();
        }
      }
    }

    if (typeof body.floor_plan_received === "boolean") {
      updates.floor_plan_received = body.floor_plan_received;
    }

    if (typeof body.walkthrough_completed === "boolean") {
      updates.walkthrough_completed = body.walkthrough_completed;
    }

    if (body.reserved_at === null || typeof body.reserved_at === "string") {
      updates.reserved_at = body.reserved_at;
    }

    if (body.completed_at === null || typeof body.completed_at === "string") {
      updates.completed_at = body.completed_at;
    }

    if (body.booking_confirmed_at === null || typeof body.booking_confirmed_at === "string") {
      updates.booking_confirmed_at = body.booking_confirmed_at;
    }

    if (body.final_payment_reminder_sent_at === null || typeof body.final_payment_reminder_sent_at === "string") {
      updates.final_payment_reminder_sent_at = body.final_payment_reminder_sent_at;
    }

    if (Array.isArray(body.requested_vendor_categories)) {
      updates.requested_vendor_categories = body.requested_vendor_categories;
    }

    if (body.vendor_request_notes === null || typeof body.vendor_request_notes === "string") {
      updates.vendor_request_notes = body.vendor_request_notes ? String(body.vendor_request_notes) : null;
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

    await syncInquiryWorkflowStage(supabaseAdmin, {
      inquiryId: id,
      actorId: auth.user.id,
      sourceAction: "inquiry.updated",
      note: "Inquiry record updated from admin workspace.",
      metadata: {
        updated_fields: Object.keys(updates),
      },
    });

    const effectiveConsultationStatus = data.consultation_status;
    const effectiveConsultationType = data.consultation_type;
    const effectiveConsultationAt = data.consultation_at;
    const effectiveConsultationLocation = data.consultation_location;
    const effectiveConsultationVideoLink = data.consultation_video_link;
    const scheduleSignature = [
      effectiveConsultationStatus,
      effectiveConsultationType,
      effectiveConsultationAt,
      effectiveConsultationLocation ?? "",
      effectiveConsultationVideoLink ?? "",
    ].join("|");

    const shouldSendConsultationScheduleEmail =
      canSendConsultationEmail() &&
      ["approved", "scheduled"].includes(effectiveConsultationStatus ?? "") &&
      Boolean(effectiveConsultationType) &&
      Boolean(effectiveConsultationAt) &&
      existing.consultation_schedule_email_signature !== scheduleSignature;

    let consultationEmailMessage: string | null = null;

    if (shouldSendConsultationScheduleEmail) {
      if (effectiveConsultationType === "in_person" && !effectiveConsultationLocation) {
        consultationEmailMessage =
          "Consultation saved, but scheduling email was not sent because the in-person location is missing.";
      } else if (data.email) {
        try {
          await sendConsultationScheduledEmails({
            clientName: `${data.first_name} ${data.last_name}`.trim(),
            clientEmail: data.email,
            clientPhone: data.phone,
            eventType: data.event_type ?? "Event consultation",
            eventDate: data.event_date ?? null,
            meetingAt: effectiveConsultationAt,
            meetingType: effectiveConsultationType,
            meetingLocation: effectiveConsultationLocation ?? null,
            videoLink: effectiveConsultationVideoLink ?? null,
          });

          await supabaseAdmin
            .from("event_inquiries")
            .update({
              consultation_schedule_email_sent_at: new Date().toISOString(),
              consultation_admin_notification_sent_at: new Date().toISOString(),
              consultation_schedule_email_signature: scheduleSignature,
            })
            .eq("id", id);

          consultationEmailMessage = "Consultation details saved and scheduling emails sent.";
        } catch (consultationEmailError) {
          console.error("Consultation scheduling email failed:", consultationEmailError);
          consultationEmailMessage =
            "Consultation saved, but the scheduling email could not be sent.";
        }
      }
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
        consultation_type: data.consultation_type,
        consultation_at: data.consultation_at,
        consultation_location: data.consultation_location,
        consultation_video_link: data.consultation_video_link,
        follow_up_at: data.follow_up_at,
        quote_response_status: data.quote_response_status,
        booking_stage: data.booking_stage,
        floor_plan_received: data.floor_plan_received,
        walkthrough_completed: data.walkthrough_completed,
        reserved_at: data.reserved_at,
        completed_at: data.completed_at,
        booking_confirmed_at: data.booking_confirmed_at,
        requested_vendor_categories: data.requested_vendor_categories,
        vendor_request_notes: data.vendor_request_notes,
        crm_owner: data.crm_owner,
        crm_next_action: data.crm_next_action,
        crm_next_action_due_at: data.crm_next_action_due_at,
        crm_lead_score: data.crm_lead_score,
        crm_lead_temperature: data.crm_lead_temperature,
        lost_reason: data.lost_reason,
        crm_lost_at: data.crm_lost_at,
        crm_lost_context: data.crm_lost_context,
        lead_closed_lost: data.status === "closed_lost",
      },
    });

    return NextResponse.json({ success: true, data, consultationEmailMessage });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("overview");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, client_id, first_name, last_name, event_type")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("event_inquiries")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      action: "inquiry.deleted",
      summary: "Inquiry deleted from admin CRM",
      metadata: {
        client_id: existing.client_id,
        client_name: `${existing.first_name} ${existing.last_name}`,
        event_type: existing.event_type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
