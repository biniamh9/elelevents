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
  inReplyTo?: string | null;
  references?: string[] | null;
  provider?: string | null;
  receivedAt?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function matchInquiryForInboundReply(
  supabase: SupabaseClient,
  input: {
    fromEmail: string;
    threadId?: string | null;
    messageId?: string | null;
    inReplyTo?: string | null;
    references?: string[] | null;
  }
) {
  const normalizedEmail = normalizeEmail(input.fromEmail);

  const candidateMessageIds = [
    input.messageId,
    input.inReplyTo,
    ...(input.references ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));

  if (input.threadId || candidateMessageIds.length > 0) {
    let query = supabase
      .from("customer_interactions")
      .select("inquiry_id, client_id, sender_email, recipient_email, created_at")
      .eq("channel", "email")
      .order("created_at", { ascending: false })
      .limit(1);

    if (input.threadId && candidateMessageIds.length > 0) {
      query = query.or(
        `thread_id.eq.${input.threadId},message_id.in.(${candidateMessageIds
          .map((value) => `"${value}"`)
          .join(",")})`
      );
    } else if (input.threadId) {
      query = query.eq("thread_id", input.threadId);
    } else {
      query = query.in("message_id", candidateMessageIds);
    }

    const { data: interactionMatch, error: interactionError } = await query.maybeSingle();

    if (interactionError) {
      throw new Error(interactionError.message);
    }

    if (interactionMatch?.inquiry_id) {
      const { data: inquiryByInteraction, error: inquiryByInteractionError } = await supabase
        .from("event_inquiries")
        .select("id, client_id, first_name, last_name, email, status, created_at")
        .eq("id", interactionMatch.inquiry_id)
        .maybeSingle();

      if (inquiryByInteractionError) {
        throw new Error(inquiryByInteractionError.message);
      }

      if (inquiryByInteraction) {
        return inquiryByInteraction;
      }
    }
  }

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
  const match = await matchInquiryForInboundReply(supabase, {
    fromEmail: input.fromEmail,
    threadId: input.threadId,
    messageId: input.messageId,
    inReplyTo: input.inReplyTo,
    references: input.references,
  });

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
      in_reply_to: input.inReplyTo ?? null,
      references: input.references ?? [],
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

export async function recordCustomerInteraction(
  supabase: SupabaseClient,
  input: {
    inquiryId: string;
    clientId?: string | null;
    channel?: "email" | "phone" | "note" | "meeting" | "other";
    direction?: "inbound" | "outbound" | "internal";
    subject?: string | null;
    bodyText: string;
    bodyHtml?: string | null;
    senderEmail?: string | null;
    recipientEmail?: string | null;
    threadId?: string | null;
    messageId?: string | null;
    metadata?: Record<string, unknown>;
    createdAt?: string | null;
  }
) {
  const insertedAt = input.createdAt ?? new Date().toISOString();

  const { error } = await supabase.from("customer_interactions").insert({
    client_id: input.clientId ?? null,
    inquiry_id: input.inquiryId,
    contract_id: null,
    channel: input.channel ?? "other",
    direction: input.direction ?? "inbound",
    subject: input.subject ?? null,
    body_text: input.bodyText,
    body_html: input.bodyHtml ?? null,
    sender_email: input.senderEmail ? normalizeEmail(input.senderEmail) : null,
    recipient_email: input.recipientEmail ? normalizeEmail(input.recipientEmail) : null,
    thread_id: input.threadId ?? null,
    message_id: input.messageId ?? null,
    provider: "client-quote-response",
    metadata: input.metadata ?? {},
    created_at: insertedAt,
    updated_at: insertedAt,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordOutboundEmailInteraction(
  supabase: SupabaseClient,
  input: {
    inquiryId: string;
    clientId?: string | null;
    subject: string;
    bodyText: string;
    senderEmail: string;
    recipientEmail: string;
    threadId?: string | null;
    messageId?: string | null;
    provider?: string | null;
    metadata?: Record<string, unknown>;
    createdAt?: string | null;
  }
) {
  const insertedAt = input.createdAt ?? new Date().toISOString();

  const { error } = await supabase.from("customer_interactions").insert({
    client_id: input.clientId ?? null,
    inquiry_id: input.inquiryId,
    contract_id: null,
    channel: "email",
    direction: "outbound",
    subject: input.subject,
    body_text: input.bodyText,
    body_html: null,
    sender_email: normalizeEmail(input.senderEmail),
    recipient_email: normalizeEmail(input.recipientEmail),
    thread_id: input.threadId ?? input.messageId ?? null,
    message_id: input.messageId ?? null,
    provider: input.provider ?? "resend",
    metadata: input.metadata ?? {},
    created_at: insertedAt,
    updated_at: insertedAt,
  });

  if (error) {
    throw new Error(error.message);
  }
}
