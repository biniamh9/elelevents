import { logActivity } from "@/lib/crm";
import type { SupabaseClient } from "@supabase/supabase-js";

export type InboundEmailReplyInput = {
  fromEmail: string;
  toEmail?: string | null;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  threadId?: string | null;
  messageId?: string | null;
  provider?: string | null;
  receivedAt?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function matchInquiryForInboundReply(
  supabase: SupabaseClient,
  fromEmail: string
) {
  const normalizedEmail = normalizeEmail(fromEmail);

  const { data, error } = await supabase
    .from("event_inquiries")
    .select("id, client_id, first_name, last_name, email, status, created_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function recordInboundEmailReply(
  supabase: SupabaseClient,
  input: InboundEmailReplyInput
) {
  const match = await matchInquiryForInboundReply(supabase, input.fromEmail);

  if (!match) {
    return {
      matched: false as const,
      inquiryId: null,
      clientId: null,
    };
  }

  const insertedAt = input.receivedAt ?? new Date().toISOString();

  const { error: insertError } = await supabase.from("customer_interactions").insert({
    client_id: match.client_id ?? null,
    inquiry_id: match.id,
    contract_id: null,
    channel: "email",
    direction: "inbound",
    subject: input.subject ?? null,
    body_text: input.bodyText,
    body_html: input.bodyHtml ?? null,
    sender_email: normalizeEmail(input.fromEmail),
    recipient_email: input.toEmail ? normalizeEmail(input.toEmail) : null,
    thread_id: input.threadId ?? null,
    message_id: input.messageId ?? null,
    provider: input.provider ?? null,
    metadata: input.metadata ?? {},
    created_at: insertedAt,
    updated_at: insertedAt,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  await logActivity(supabase, {
    entityType: "inquiry",
    entityId: match.id,
    action: "inquiry.reply_received",
    summary: input.subject?.trim()
      ? `Lead replied: ${input.subject.trim()}`
      : "Lead replied by email",
    metadata: {
      client_email: normalizeEmail(input.fromEmail),
      thread_id: input.threadId ?? null,
      message_id: input.messageId ?? null,
      provider: input.provider ?? null,
      body_preview: input.bodyText.slice(0, 240),
    },
  });

  return {
    matched: true as const,
    inquiryId: match.id,
    clientId: match.client_id ?? null,
  };
}
