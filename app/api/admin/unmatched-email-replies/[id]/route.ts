import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { recordCustomerInteraction } from "@/lib/customer-interactions";
import { normalizeConversationKey } from "@/lib/crm-opportunity-identity";
import { getUnmatchedInboundReplyById } from "@/lib/unmatched-inbound-replies";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type Action = "attach" | "resolve" | "ignore";

function mergeMetadata(
  current: Record<string, unknown> | null | undefined,
  next: Record<string, unknown>
) {
  return {
    ...(current ?? {}),
    ...next,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("overview");

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: Action;
      inquiryId?: string;
    } | null;

    const action = body?.action;

    if (!action || !["attach", "resolve", "ignore"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const reply = await getUnmatchedInboundReplyById(id);

    if (!reply) {
      return NextResponse.json({ error: "Unmatched reply not found." }, { status: 404 });
    }

    if (action === "attach") {
      if (!body?.inquiryId) {
        return NextResponse.json({ error: "Inquiry is required to attach this reply." }, { status: 400 });
      }

      const { data: inquiry, error: inquiryError } = await supabaseAdmin
        .from("event_inquiries")
        .select("id, client_id, crm_conversation_key, first_name, last_name, event_type, event_date, status")
        .eq("id", body.inquiryId)
        .maybeSingle();

      if (inquiryError) {
        return NextResponse.json({ error: inquiryError.message }, { status: 500 });
      }

      if (!inquiry) {
        return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
      }

      await recordCustomerInteraction(supabaseAdmin, {
        inquiryId: inquiry.id,
        clientId: inquiry.client_id ?? null,
        channel: "email",
        direction: "inbound",
        subject: reply.subject ?? null,
        bodyText: reply.body_text,
        bodyHtml: reply.body_html ?? null,
        senderEmail: reply.from_email,
        recipientEmail: reply.to_email ?? null,
        conversationKey:
          normalizeConversationKey(inquiry.crm_conversation_key) ??
          normalizeConversationKey(reply.conversation_key) ??
          null,
        threadId: reply.thread_id ?? null,
        messageId: reply.message_id ?? null,
        provider: reply.provider ?? null,
        metadata: mergeMetadata(reply.metadata, {
          source: "unmatched_inbound_reply_review",
          unmatched_reply_id: reply.id,
          original_match_reason: reply.match_reason,
          original_conversation_key: reply.conversation_key,
          original_in_reply_to: reply.in_reply_to,
        }),
        createdAt: reply.created_at,
      });

      const resolvedAt = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from("unmatched_inbound_email_replies")
        .update({
          review_status: "resolved",
          metadata: mergeMetadata(reply.metadata, {
            resolution: "attached_to_inquiry",
            resolved_at: resolvedAt,
            resolved_by_admin_id: auth.user?.id ?? null,
            attached_inquiry_id: inquiry.id,
          }),
        })
        .eq("id", reply.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await logActivity(supabaseAdmin, {
        entityType: "inquiry",
        entityId: inquiry.id,
        action: "inquiry.reply_attached_from_review",
        summary: "Inbound reply was manually attached after unmatched review.",
        actorId: auth.user?.id ?? null,
        metadata: {
          unmatched_reply_id: reply.id,
          from_email: reply.from_email,
          subject: reply.subject,
          thread_id: reply.thread_id,
          message_id: reply.message_id,
          match_reason: reply.match_reason,
        },
      });

      return NextResponse.json({ success: true, status: "resolved", inquiryId: inquiry.id });
    }

    const nextStatus = action === "ignore" ? "ignored" : "resolved";
    const resolvedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("unmatched_inbound_email_replies")
      .update({
        review_status: nextStatus,
        metadata: mergeMetadata(reply.metadata, {
          resolution: action === "ignore" ? "ignored" : "resolved_without_attach",
          resolved_at: resolvedAt,
          resolved_by_admin_id: auth.user?.id ?? null,
        }),
      })
      .eq("id", reply.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Failed to update unmatched reply:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
