import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth/admin";
import { createDocusignEnvelope, getDocuSignSetupError, isDocuSignConfigured } from "@/lib/docusign";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;

    const { data: contract } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const email = contract.client_email;
    const name = contract.client_name;
    if (!email || !name) {
      return NextResponse.json(
        { error: "Client name and email are required" },
        { status: 400 }
      );
    }

    if (isDocuSignConfigured()) {
      if (contract.docusign_envelope_id && contract.docusign_envelope_status !== "voided") {
        return NextResponse.json(
          { error: "This contract already has a DocuSign envelope. Sync its status instead of sending a duplicate." },
          { status: 400 }
        );
      }

      const envelope = await createDocusignEnvelope(contract);
      const sentAt = new Date().toISOString();

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("contracts")
        .update({
          docusign_envelope_id: envelope.envelopeId,
          docusign_envelope_status: envelope.status,
          contract_status: "sent",
          contract_sent_at: sentAt,
          docusign_url: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message || "DocuSign envelope was created, but the CRM failed to save it." },
          { status: 500 }
        );
      }

      await logActivity(supabaseAdmin, {
        entityType: "contract",
        entityId: id,
        action: "contract.sent",
        summary: "Contract sent through DocuSign",
        metadata: {
          client_email: email,
          envelope_id: envelope.envelopeId,
          envelope_status: envelope.status,
        },
      });

      if (updated.inquiry_id) {
        await supabaseAdmin
          .from("event_inquiries")
          .update({ booking_stage: "contract_sent" })
          .eq("id", updated.inquiry_id);
      }

      return NextResponse.json({
        success: true,
        mode: "docusign",
        envelopeId: envelope.envelopeId,
        envelopeStatus: envelope.status,
        contract: updated,
      });
    }

    const docusign = contract.docusign_url;
    if (!docusign) {
      return NextResponse.json(
        { error: getDocuSignSetupError() || "Manual signing link missing" },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!process.env.NOTIFICATION_FROM_EMAIL) {
      return NextResponse.json(
        { error: "NOTIFICATION_FROM_EMAIL is not configured" },
        { status: 500 }
      );
    }

    const { error: sendError } = await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL,
      to: email,
      subject: "Your Event Contract – Elel Events",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for choosing Elel Events for your upcoming event.</p>
        <p>Please review and sign your contract using the link below:</p>
        <p>
          <a href="${docusign}" style="padding:12px 20px;background:#a74471;color:white;text-decoration:none;border-radius:6px;">
            Review & Sign Contract
          </a>
        </p>
        <p>Once signed, we will confirm your booking and send deposit instructions.</p>
        <p>Thank you,<br/>Elel Events</p>
      `,
    });

    if (sendError) {
      console.error("Contract email send failed:", sendError);
      return NextResponse.json(
        { error: sendError.message || "Contract email failed to send" },
        { status: 500 }
      );
    }

    const sentAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        contract_status: "sent",
        contract_sent_at: sentAt,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update contract after sending" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: id,
      action: "contract.sent",
      summary: "Contract email sent to client using manual signing link",
      metadata: {
        client_email: email,
        manual_link: true,
      },
    });

    if (updated.inquiry_id) {
      await supabaseAdmin
        .from("event_inquiries")
        .update({ booking_stage: "contract_sent" })
        .eq("id", updated.inquiry_id);
    }

    return NextResponse.json({ success: true, mode: "manual", contract: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Contract send failed" },
      { status: 500 }
    );
  }
}
