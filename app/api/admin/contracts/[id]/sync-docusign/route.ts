import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { getDocusignEnvelopeStatus, getDocuSignSetupError } from "@/lib/docusign";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

function mapEnvelopeStatusToContractStatus(status: string) {
  if (status === "completed") {
    return "signed";
  }

  if (status === "sent" || status === "delivered") {
    return "sent";
  }

  return null;
}

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
    const configError = getDocuSignSetupError();

    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 });
    }

    const { data: contract, error } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (!contract.docusign_envelope_id) {
      return NextResponse.json(
        { error: "No DocuSign envelope is linked to this contract yet" },
        { status: 400 }
      );
    }

    const envelope = await getDocusignEnvelopeStatus(contract.docusign_envelope_id);
    const nextContractStatus = mapEnvelopeStatusToContractStatus(envelope.status);

    const updates: Record<string, unknown> = {
      docusign_envelope_status: envelope.status,
    };

    if (nextContractStatus) {
      updates.contract_status = nextContractStatus;
    }

    if (envelope.status === "completed" && !contract.signed_at) {
      updates.signed_at =
        envelope.completedDateTime ||
        envelope.deliveredDateTime ||
        new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to sync DocuSign status" },
        { status: 500 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: updated.id,
      action: "contract.docusign_synced",
      summary: "DocuSign envelope status synced",
      metadata: {
        envelope_id: contract.docusign_envelope_id,
        envelope_status: envelope.status,
      },
    });

    if (updated.inquiry_id) {
      await syncInquiryWorkflowStage(supabaseAdmin, {
        inquiryId: updated.inquiry_id,
        actorId: auth.user.id,
        sourceAction: "contract.docusign_synced",
        note: "DocuSign envelope status synced from admin workspace.",
        metadata: {
          envelope_status: envelope.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      contract: updated,
      envelopeStatus: envelope.status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync DocuSign status" },
      { status: 500 }
    );
  }
}
