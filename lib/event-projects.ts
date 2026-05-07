import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveEventProjectStatusFromLegacy,
  normalizeEventProjectStatus,
  type EventProjectStatus,
} from "@/lib/project-lifecycle";

type InquiryProjectSource = {
  id: string;
  client_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  venue_name?: string | null;
  guest_count?: number | null;
  services?: unknown;
  additional_info?: string | null;
  status?: string | null;
  booking_stage?: string | null;
  quote_response_status?: string | null;
  consultation_status?: string | null;
  crm_next_action?: string | null;
  crm_next_action_due_at?: string | null;
  quoted_at?: string | null;
  reserved_at?: string | null;
  booked_at?: string | null;
  completed_at?: string | null;
  crm_lost_at?: string | null;
  admin_notes?: string | null;
  assigned_to?: string | null;
  crm_owner?: string | null;
  crm_lead_score?: number | null;
  crm_lead_temperature?: string | null;
};

type EventProjectSupport = {
  projectsTable: boolean;
  contractsProjectColumn: boolean;
  documentsProjectColumn: boolean;
  paymentsProjectColumn: boolean;
  interactionsProjectColumn: boolean;
  tasksProjectColumn: boolean;
};

let supportCache: Promise<EventProjectSupport> | null = null;

function isMissingSchemaError(error: { code?: string | null; message?: string | null } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

async function probeSelect(
  supabase: SupabaseClient,
  table: string,
  selectClause: string
) {
  const { error } = await supabase.from(table).select(selectClause).limit(1);
  if (error && isMissingSchemaError(error)) {
    return false;
  }
  return true;
}

export async function getEventProjectSupport(
  supabase: SupabaseClient
): Promise<EventProjectSupport> {
  if (!supportCache) {
    supportCache = (async () => {
      const projectsTable = await probeSelect(supabase, "event_projects", "id");
      return {
        projectsTable,
        contractsProjectColumn: projectsTable && (await probeSelect(supabase, "contracts", "event_project_id")),
        documentsProjectColumn:
          projectsTable && (await probeSelect(supabase, "client_documents", "event_project_id")),
        paymentsProjectColumn:
          projectsTable && (await probeSelect(supabase, "contract_payments", "event_project_id")),
        interactionsProjectColumn:
          projectsTable &&
          (await probeSelect(supabase, "customer_interactions", "event_project_id")),
        tasksProjectColumn:
          projectsTable && (await probeSelect(supabase, "crm_follow_up_tasks", "event_project_id")),
      };
    })();
  }

  return supportCache;
}

function extractInvestmentRange(source: string | null | undefined) {
  if (!source) return null;
  const match = source.match(/(?:Investment range|Budget range):\s*([^\n]+)/i);
  return match?.[1]?.trim() || null;
}

function normalizeServices(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function ensureEventProjectForInquiry(
  supabase: SupabaseClient,
  inquiry: InquiryProjectSource,
  options?: {
    explicitStatus?: EventProjectStatus | string | null;
    contractStatus?: string | null;
    paymentStatus?: string | null;
    depositPaid?: boolean | null;
  }
) {
  const support = await getEventProjectSupport(supabase);
  if (!support.projectsTable) {
    return { projectId: null as string | null, support };
  }

  const payload = {
    client_id: inquiry.client_id ?? null,
    inquiry_id: inquiry.id,
    project_name: `${inquiry.event_type || "Event"} · ${[inquiry.first_name, inquiry.last_name].filter(Boolean).join(" ").trim() || "Client"}`,
    event_type: inquiry.event_type ?? null,
    event_date: inquiry.event_date ?? null,
    venue_name: inquiry.venue_name ?? null,
    guest_count: inquiry.guest_count ?? null,
    services: normalizeServices(inquiry.services),
    investment_range: extractInvestmentRange(inquiry.additional_info),
    status:
      normalizeEventProjectStatus(options?.explicitStatus) ??
      deriveEventProjectStatusFromLegacy({
        inquiryStatus: inquiry.status,
        bookingStage: inquiry.booking_stage,
        quoteResponseStatus: inquiry.quote_response_status,
        consultationStatus: inquiry.consultation_status,
        contractStatus: options?.contractStatus,
        paymentStatus: options?.paymentStatus,
        depositPaid: options?.depositPaid,
        completedAt: inquiry.completed_at,
      }),
    next_action: inquiry.crm_next_action ?? null,
    next_action_due_at: inquiry.crm_next_action_due_at ?? null,
    assigned_to: inquiry.assigned_to ?? null,
    source_inquiry_status: inquiry.status ?? null,
    booking_stage: inquiry.booking_stage ?? null,
    contract_status: options?.contractStatus ?? null,
    payment_status: options?.paymentStatus ?? null,
    quoted_at: inquiry.quoted_at ?? null,
    reserved_at: inquiry.reserved_at ?? null,
    booked_at: inquiry.booked_at ?? null,
    completed_at: inquiry.completed_at ?? null,
    lost_at: inquiry.crm_lost_at ?? null,
    notes: inquiry.admin_notes ?? null,
    metadata: {
      consultation_status: inquiry.consultation_status ?? null,
      quote_response_status: inquiry.quote_response_status ?? null,
      crm_owner: inquiry.crm_owner ?? null,
      crm_lead_score: inquiry.crm_lead_score ?? null,
      crm_lead_temperature: inquiry.crm_lead_temperature ?? null,
    },
  };

  const { data, error } = await supabase
    .from("event_projects")
    .upsert(payload, { onConflict: "inquiry_id" })
    .select("id")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) {
      return { projectId: null as string | null, support: { ...support, projectsTable: false } };
    }
    throw new Error(error.message);
  }

  return { projectId: data?.id ?? null, support };
}

export async function syncEventProjectLinks(
  supabase: SupabaseClient,
  input: {
    projectId: string | null;
    inquiryId?: string | null;
    contractId?: string | null;
  }
) {
  if (!input.projectId) return;

  const support = await getEventProjectSupport(supabase);

  if (support.contractsProjectColumn && input.contractId) {
    await supabase
      .from("contracts")
      .update({ event_project_id: input.projectId })
      .eq("id", input.contractId);
  }

  if (support.documentsProjectColumn) {
    if (input.inquiryId) {
      await supabase
        .from("client_documents")
        .update({ event_project_id: input.projectId })
        .eq("inquiry_id", input.inquiryId);
    }
    if (input.contractId) {
      await supabase
        .from("client_documents")
        .update({ event_project_id: input.projectId })
        .eq("contract_id", input.contractId);
    }
  }

  if (support.paymentsProjectColumn && input.contractId) {
    await supabase
      .from("contract_payments")
      .update({ event_project_id: input.projectId })
      .eq("contract_id", input.contractId);
  }

  if (support.interactionsProjectColumn && input.inquiryId) {
    await supabase
      .from("customer_interactions")
      .update({ event_project_id: input.projectId })
      .eq("inquiry_id", input.inquiryId);
  }

  if (support.tasksProjectColumn && input.inquiryId) {
    await supabase
      .from("crm_follow_up_tasks")
      .update({ event_project_id: input.projectId })
      .eq("inquiry_id", input.inquiryId);
  }
}

export async function getEventProjectByInquiryId(
  supabase: SupabaseClient,
  inquiryId: string
) {
  const support = await getEventProjectSupport(supabase);
  if (!support.projectsTable) return null;

  const { data, error } = await supabase
    .from("event_projects")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw new Error(error.message);
  }

  return data;
}

export async function syncEventProjectLifecycleForInquiryId(
  supabase: SupabaseClient,
  inquiryId: string,
  options?: {
    explicitStatus?: EventProjectStatus | string | null;
    contractStatus?: string | null;
    paymentStatus?: string | null;
    depositPaid?: boolean | null;
  }
) {
  const support = await getEventProjectSupport(supabase);
  if (!support.projectsTable) {
    return { projectId: null as string | null, support };
  }

  const { data: inquiry, error } = await supabase
    .from("event_inquiries")
    .select(
      "id, client_id, first_name, last_name, event_type, event_date, venue_name, guest_count, services, additional_info, status, booking_stage, quote_response_status, consultation_status, crm_next_action, crm_next_action_due_at, quoted_at, reserved_at, booked_at, completed_at, crm_lost_at, admin_notes, assigned_to, crm_owner, crm_lead_score, crm_lead_temperature"
    )
    .eq("id", inquiryId)
    .maybeSingle<InquiryProjectSource>();

  if (error) {
    if (isMissingSchemaError(error)) {
      return { projectId: null as string | null, support: { ...support, projectsTable: false } };
    }
    throw new Error(error.message);
  }

  if (!inquiry) {
    return { projectId: null as string | null, support };
  }

  return ensureEventProjectForInquiry(supabase, inquiry, options);
}

export async function getEventProjectsByInquiryIds(
  supabase: SupabaseClient,
  inquiryIds: string[]
) {
  const support = await getEventProjectSupport(supabase);
  if (!support.projectsTable || !inquiryIds.length) return [];

  const { data, error } = await supabase
    .from("event_projects")
    .select("*")
    .in("inquiry_id", inquiryIds);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getEventProjectById(
  supabase: SupabaseClient,
  projectId: string
) {
  const support = await getEventProjectSupport(supabase);
  if (!support.projectsTable) return null;

  const { data, error } = await supabase
    .from("event_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw new Error(error.message);
  }

  return data;
}
