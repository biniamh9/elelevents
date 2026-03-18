import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function normalizeHeaderValue(value: string) {
  return value.trim().replace(/^sha256=/i, "");
}

function verifyDocusignSignature(rawBody: string, signature: string) {
  const secret = process.env.DOCUSIGN_CONNECT_KEY?.trim();
  if (!secret) {
    return true;
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const provided = normalizeHeaderValue(signature);

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

function extractEnvelope(payload: Record<string, any>) {
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, any>)
      : {};

  const envelopeId =
    payload.envelopeId ||
    payload.envelope_id ||
    data.envelopeId ||
    data.envelope_id ||
    data.envelopeSummary?.envelopeId ||
    null;

  const status =
    payload.status ||
    payload.envelopeStatus ||
    payload.envelopeStatusCode ||
    data.status ||
    data.envelopeStatus ||
    null;

  const event =
    payload.event ||
    payload.eventType ||
    data.event ||
    data.eventType ||
    null;

  return {
    envelopeId,
    status: typeof status === "string" ? status.toLowerCase() : null,
    event: typeof event === "string" ? event.toLowerCase() : null,
  };
}

function isSignedEvent(status: string | null, event: string | null) {
  return status === "completed" || event === "envelope-completed";
}

function isSentEvent(status: string | null, event: string | null) {
  return status === "sent" || status === "delivered" || event === "envelope-delivered";
}

function isDeclinedEvent(status: string | null, event: string | null) {
  return status === "declined" || event === "envelope-declined";
}

function isVoidedEvent(status: string | null, event: string | null) {
  return status === "voided" || event === "envelope-voided";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-docusign-signature-1") ||
      request.headers.get("X-DocuSign-Signature-1");

    if (process.env.DOCUSIGN_CONNECT_KEY?.trim() && !signature) {
      return NextResponse.json({ error: "Missing DocuSign signature" }, { status: 401 });
    }

    if (signature && !verifyDocusignSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid DocuSign signature" }, { status: 401 });
    }

    const payload = rawBody ? (JSON.parse(rawBody) as Record<string, any>) : {};
    const envelope = extractEnvelope(payload);

    if (!envelope.envelopeId) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const { data: contract, error } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("docusign_envelope_id", envelope.envelopeId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contract) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const updates: Record<string, unknown> = {
      docusign_envelope_status: envelope.status ?? envelope.event ?? contract.docusign_envelope_status,
    };

    if (isSentEvent(envelope.status, envelope.event)) {
      updates.contract_status = "sent";
    }

    if (isSignedEvent(envelope.status, envelope.event)) {
      updates.contract_status = "signed";
      updates.signed_at = contract.signed_at || new Date().toISOString();
    }

    if (isDeclinedEvent(envelope.status, envelope.event)) {
      updates.docusign_envelope_status = "declined";
    }

    if (isVoidedEvent(envelope.status, envelope.event)) {
      updates.docusign_envelope_status = "voided";
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update(updates)
      .eq("id", contract.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update contract from webhook" },
        { status: 500 }
      );
    }

    if (updated.inquiry_id) {
      await supabaseAdmin
        .from("event_inquiries")
        .update({
          booking_stage: isSignedEvent(envelope.status, envelope.event)
            ? "contract_sent"
            : "contract_sent",
        })
        .eq("id", updated.inquiry_id);
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: updated.id,
      action: "contract.docusign_webhook",
      summary: `DocuSign webhook received: ${updates.docusign_envelope_status ?? "unknown"}`,
      metadata: {
        envelope_id: envelope.envelopeId,
        envelope_status: updates.docusign_envelope_status,
        event: envelope.event,
      },
    });

    if (
      isSignedEvent(envelope.status, envelope.event) &&
      resend &&
      process.env.NOTIFICATION_TO_EMAIL &&
      process.env.NOTIFICATION_FROM_EMAIL
    ) {
      const eventDate = updated.event_date || "TBD";
      await resend.emails.send({
        from: process.env.NOTIFICATION_FROM_EMAIL,
        to: process.env.NOTIFICATION_TO_EMAIL,
        subject: `Contract signed: ${updated.client_name}`,
        html: `
          <h2>Contract Signed</h2>
          <p><strong>Client:</strong> ${updated.client_name}</p>
          <p><strong>Email:</strong> ${updated.client_email || "N/A"}</p>
          <p><strong>Event:</strong> ${updated.event_type || "Event"}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Contract total:</strong> $${Number(updated.contract_total || 0).toLocaleString()}</p>
          <p>The DocuSign envelope has been completed and the CRM was updated automatically.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DocuSign webhook failed" },
      { status: 500 }
    );
  }
}
