import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth/admin";
import { createDocusignEnvelope, getDocuSignSetupError, isDocuSignConfigured } from "@/lib/docusign";
import { logActivity } from "@/lib/crm";
import { getNotificationFromEmail, renderBrandedEmail } from "@/lib/email-template-renderer";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

        await syncInquiryWorkflowStage(supabaseAdmin, {
          inquiryId: updated.inquiry_id,
          actorId: auth.user.id,
          sourceAction: "contract.sent",
          note: "Contract sent to client through DocuSign.",
          metadata: {
            delivery_mode: "docusign",
          },
        });
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

    const fromEmail = getNotificationFromEmail();

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your Event Contract – Elel Events",
      html: renderBrandedEmail({
        eyebrow: "Contract Ready",
        heading: "Your event agreement is ready for review.",
        intro: `Hello ${name}, thank you for choosing Elel Events for your celebration.`,
        body: `
          <p>Please review and sign your contract using the secure link below.</p>
          <div style="margin:26px 0;">
            <a href="${docusign}" style="display:inline-block;padding:14px 24px;background:#8c5327;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">
              Review & Sign Contract
            </a>
          </div>
          <p>Once signed, we will confirm your booking status and share the next payment and production steps.</p>
        `,
        footerNote: "If you need any clarification before signing, reply directly to this message and our team will assist you.",
      }),
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

      await syncInquiryWorkflowStage(supabaseAdmin, {
        inquiryId: updated.inquiry_id,
        actorId: auth.user.id,
        sourceAction: "contract.sent",
        note: "Contract email sent to client using manual signing link.",
        metadata: {
          delivery_mode: "manual",
        },
      });
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
