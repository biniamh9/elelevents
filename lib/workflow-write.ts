import type { SupabaseClient } from "@supabase/supabase-js";
import { deriveWorkflowStage, type WorkflowStage } from "@/lib/workflow-stage";

type SyncInquiryWorkflowStageInput = {
  inquiryId: string;
  actorId?: string | null;
  sourceAction: string;
  note?: string | null;
  metadata?: Record<string, unknown>;
  updatedAt?: string | null;
};

type InquiryWorkflowSnapshot = {
  id: string;
  status: string | null;
  consultation_status: string | null;
  quote_response_status: string | null;
  booking_stage: string | null;
  completed_at: string | null;
  workflow_stage: WorkflowStage | null;
};

type ContractWorkflowSnapshot = {
  contract_status: string | null;
  deposit_paid: boolean | null;
};

function isWorkflowStage(value: string | null): value is WorkflowStage {
  return (
    value === "intake" ||
    value === "consultation" ||
    value === "quote" ||
    value === "contract" ||
    value === "handoff"
  );
}

export async function syncInquiryWorkflowStage(
  supabase: SupabaseClient,
  input: SyncInquiryWorkflowStageInput
) {
  const [{ data: inquiry, error: inquiryError }, { data: contract, error: contractError }] =
    await Promise.all([
      supabase
        .from("event_inquiries")
        .select(
          "id, status, consultation_status, quote_response_status, booking_stage, completed_at, workflow_stage"
        )
        .eq("id", input.inquiryId)
        .single<InquiryWorkflowSnapshot>(),
      supabase
        .from("contracts")
        .select("contract_status, deposit_paid")
        .eq("inquiry_id", input.inquiryId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ContractWorkflowSnapshot>(),
    ]);

  if (inquiryError || !inquiry) {
    throw new Error(inquiryError?.message || "Inquiry not found for workflow sync");
  }

  if (contractError) {
    throw new Error(contractError.message);
  }

  const nextWorkflowStage = deriveWorkflowStage({
    bookingStage: inquiry.booking_stage,
    inquiryStatus: inquiry.status,
    consultationStatus: inquiry.consultation_status,
    quoteResponseStatus: inquiry.quote_response_status,
    contractStatus: contract?.contract_status,
    depositPaid: contract?.deposit_paid,
    completedAt: inquiry.completed_at,
  });

  const currentWorkflowStage = isWorkflowStage(inquiry.workflow_stage)
    ? inquiry.workflow_stage
    : null;
  const transitionTimestamp = input.updatedAt ?? new Date().toISOString();
  const stageChanged = currentWorkflowStage !== nextWorkflowStage;

  const { error: updateError } = await supabase
    .from("event_inquiries")
    .update({
      workflow_stage: nextWorkflowStage,
      workflow_updated_at: transitionTimestamp,
    })
    .eq("id", input.inquiryId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (stageChanged || currentWorkflowStage === null) {
    const { error: transitionError } = await supabase
      .from("workflow_transitions")
      .insert({
        inquiry_id: input.inquiryId,
        actor_id: input.actorId ?? null,
        from_stage: currentWorkflowStage,
        to_stage: nextWorkflowStage,
        source_action: input.sourceAction,
        note: input.note ?? null,
        metadata: input.metadata ?? {},
        created_at: transitionTimestamp,
      });

    if (transitionError) {
      throw new Error(transitionError.message);
    }
  }

  return {
    inquiryId: input.inquiryId,
    previousWorkflowStage: currentWorkflowStage,
    workflowStage: nextWorkflowStage,
    stageChanged,
  };
}
