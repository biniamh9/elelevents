import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrmLead, CrmTask, CrmTaskStatus } from "@/lib/crm-analytics";

type FollowUpTaskKind =
  | "quote_approval"
  | "quote_changes"
  | "quote_followup"
  | "deposit_followup"
  | "contract_followup"
  | "general";

type FollowUpTaskRecord = {
  id: string;
  inquiry_id: string;
  client_id: string | null;
  title: string;
  detail: string | null;
  task_kind: FollowUpTaskKind;
  status: "open" | "completed";
  due_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  owner_name: string | null;
  source_action: string | null;
};

function inferCrmTaskStatus(kind: FollowUpTaskKind, dueAt: string | null): CrmTaskStatus {
  if (kind === "quote_changes") return "today";
  if (kind === "quote_approval") return "contract";
  if (kind === "deposit_followup") return "deposit";

  if (!dueAt) return "today";

  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs < 0) return "overdue";
  if (diffMs < 24 * 60 * 60 * 1000) return "today";
  return "awaiting_reply";
}

function buildDueLabel(kind: FollowUpTaskKind, dueAt: string | null) {
  if (kind === "quote_approval") return "Contract / booking follow-up";
  if (kind === "quote_changes") return "Client requested revisions";
  if (kind === "deposit_followup") return "Deposit follow-up";
  if (kind === "contract_followup") return "Unsigned contract";

  if (!dueAt) return "Follow-up needed";

  const dueDate = new Date(dueAt);
  const diffDays = Math.round((dueDate.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)} day overdue`;
  if (diffDays === 0) return "Due today";
  return `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export async function upsertFollowUpTask(
  supabase: SupabaseClient,
  input: {
    inquiryId: string;
    clientId?: string | null;
    title: string;
    detail?: string | null;
    taskKind: FollowUpTaskKind;
    dueAt?: string | null;
    ownerName?: string | null;
    sourceAction?: string | null;
  }
) {
  const { data: existing, error: existingError } = await supabase
    .from("crm_follow_up_tasks")
    .select("id")
    .eq("inquiry_id", input.inquiryId)
    .eq("task_kind", input.taskKind)
    .eq("status", "open")
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("crm_follow_up_tasks")
      .update({
        title: input.title,
        detail: input.detail ?? null,
        due_at: input.dueAt ?? null,
        owner_name: input.ownerName ?? null,
        source_action: input.sourceAction ?? null,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("crm_follow_up_tasks")
    .insert({
      inquiry_id: input.inquiryId,
      client_id: input.clientId ?? null,
      title: input.title,
      detail: input.detail ?? null,
      task_kind: input.taskKind,
      status: "open",
      due_at: input.dueAt ?? null,
      owner_name: input.ownerName ?? null,
      source_action: input.sourceAction ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return created.id;
}

export async function getPersistedCrmTasks(
  supabase: SupabaseClient,
  filters: {
    inquiryId?: string;
    status?: "open" | "completed";
    leadLookup?: Map<string, Pick<CrmLead, "clientName" | "eventType">>;
  } = {}
): Promise<CrmTask[]> {
  let query = supabase
    .from("crm_follow_up_tasks")
    .select("id, inquiry_id, client_id, title, detail, task_kind, status, due_at, created_at, updated_at, completed_at, owner_name, source_action")
    .order("created_at", { ascending: false });

  if (filters.inquiryId) {
    query = query.eq("inquiry_id", filters.inquiryId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as FollowUpTaskRecord[]).map((task) => {
    const lead = filters.leadLookup?.get(task.inquiry_id);
    return {
      id: task.id,
      leadId: task.inquiry_id,
      title: task.title,
      status: inferCrmTaskStatus(task.task_kind, task.due_at),
      dueLabel: buildDueLabel(task.task_kind, task.due_at),
      detail: task.detail ?? (lead ? `${lead.clientName} · ${lead.eventType}` : undefined),
    };
  });
}
