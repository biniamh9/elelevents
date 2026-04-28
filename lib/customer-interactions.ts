import { buildInboundReplyActivityEvent } from "@/lib/email-activity-events";
import {
  extractConversationKeyFromAddress,
  normalizeConversationKey,
} from "@/lib/crm-opportunity-identity";
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
    toEmail?: string | null;
    threadId?: string | null;
    messageId?: string | null;
    inReplyTo?: string | null;
    references?: string[] | null;
    metadata?: Record<string, unknown>;
  }
) {
  const metadataConversationKey =
    typeof input.metadata?.conversationKey === "string"
      ? input.metadata.conversationKey
      : typeof input.metadata?.conversation_key === "string"
        ? input.metadata.conversation_key
        : null;
  const inferredConversationKey =
    normalizeConversationKey(metadataConversationKey) ??
    extractConversationKeyFromAddress(input.toEmail);
  if (inferredConversationKey) {
    const { data: inquiryByConversationKey, error: inquiryByConversationKeyError } =
      await supabase
        .from("event_inquiries")
        .select(
          "id, client_id, first_name, last_name, email, status, created_at, crm_conversation_key"
        )
        .eq("crm_conversation_key", inferredConversationKey)
        .maybeSingle();

    if (inquiryByConversationKeyError) {
      throw new Error(inquiryByConversationKeyError.message);
    }

    if (inquiryByConversationKey) {
      return {
        inquiry: inquiryByConversationKey,
        matchReason: "conversation_key" as const,
        conversationKey: inferredConversationKey,
      };
    }
  }

  const candidateMessageIds = [
    input.messageId,
    input.inReplyTo,
    ...(input.references ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));

  if (input.threadId || candidateMessageIds.length > 0) {
    let query = supabase
      .from("customer_interactions")
      .select("inquiry_id, client_id, sender_email, recipient_email, created_at, conversation_key")
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
        .select(
          "id, client_id, first_name, last_name, email, status, created_at, crm_conversation_key"
        )
        .eq("id", interactionMatch.inquiry_id)
        .maybeSingle();

      if (inquiryByInteractionError) {
        throw new Error(inquiryByInteractionError.message);
      }

      if (inquiryByInteraction) {
        return {
          inquiry: inquiryByInteraction,
          matchReason: "thread_or_message" as const,
          conversationKey:
            normalizeConversationKey(interactionMatch.conversation_key) ??
            normalizeConversationKey(inquiryByInteraction.crm_conversation_key),
        };
      }
    }
  }

  return {
    inquiry: null,
    matchReason: inferredConversationKey ? "missing_conversation_match" : "email_only_unsafe",
    conversationKey: inferredConversationKey,
  };
}

export async function recordInboundEmailReply(
  supabase: SupabaseClient,
  input: InboundEmailReplyInput
) {
  const match = await matchInquiryForInboundReply(supabase, {
    fromEmail: input.fromEmail,
    toEmail: input.toEmail,
    threadId: input.threadId,
    messageId: input.messageId,
    inReplyTo: input.inReplyTo,
    references: input.references,
    metadata: input.metadata,
  });

  if (!match.inquiry) {
    const { error: unmatchedError } = await supabase
      .from("unmatched_inbound_email_replies")
      .insert({
        from_email: normalizeEmail(input.fromEmail),
        to_email: input.toEmail ? normalizeEmail(input.toEmail) : null,
        subject: input.subject ?? null,
        body_text: input.bodyText,
        body_html: input.bodyHtml ?? null,
        thread_id: input.threadId ?? null,
        message_id: input.messageId ?? null,
        in_reply_to: input.inReplyTo ?? null,
        provider: input.provider ?? null,
        conversation_key: match.conversationKey ?? null,
        match_reason: match.matchReason,
        metadata: {
          ...(input.metadata ?? {}),
          references: input.references ?? [],
        },
      });

    if (unmatchedError) {
      throw new Error(unmatchedError.message);
    }

    return {
      matched: false as const,
      inquiryId: null,
      clientId: null,
      reason: match.matchReason,
    };
  }

  const insertedAt = input.receivedAt ?? new Date().toISOString();

  const { error: insertError } = await supabase.from("customer_interactions").insert({
    client_id: match.inquiry.client_id ?? null,
    inquiry_id: match.inquiry.id,
    contract_id: null,
    channel: "email",
    direction: "inbound",
    subject: input.subject ?? null,
    body_text: input.bodyText,
    body_html: input.bodyHtml ?? null,
    sender_email: normalizeEmail(input.fromEmail),
    recipient_email: input.toEmail ? normalizeEmail(input.toEmail) : null,
    conversation_key:
      match.conversationKey ??
      normalizeConversationKey(match.inquiry.crm_conversation_key) ??
      null,
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
    entityId: match.inquiry.id,
    ...buildInboundReplyActivityEvent({
      fromEmail: normalizeEmail(input.fromEmail),
      subject: input.subject,
      threadId: input.threadId,
      messageId: input.messageId,
      inReplyTo: input.inReplyTo,
      references: input.references,
      provider: input.provider,
      bodyText: input.bodyText,
    }),
  });

  return {
    matched: true as const,
    inquiryId: match.inquiry.id,
    clientId: match.inquiry.client_id ?? null,
    reason: match.matchReason,
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
    conversationKey?: string | null;
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
    conversation_key: normalizeConversationKey(input.conversationKey) ?? null,
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
    conversationKey?: string | null;
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
    conversation_key: normalizeConversationKey(input.conversationKey) ?? null,
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
