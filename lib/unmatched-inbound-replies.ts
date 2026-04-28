import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type UnmatchedInboundReplyReviewStatus =
  | "pending_review"
  | "resolved"
  | "ignored";

export type UnmatchedInboundReply = {
  id: string;
  created_at: string;
  updated_at: string;
  from_email: string;
  to_email: string | null;
  subject: string | null;
  body_text: string;
  body_html: string | null;
  thread_id: string | null;
  message_id: string | null;
  in_reply_to: string | null;
  provider: string | null;
  conversation_key: string | null;
  match_reason: string;
  metadata: Record<string, unknown> | null;
  review_status: UnmatchedInboundReplyReviewStatus;
};

export type UnmatchedReplyNotificationItem = {
  id: string;
  created_at: string;
  is_read: boolean;
  reply: UnmatchedInboundReply;
};

export type UnmatchedInboundReplyCounts = Record<
  UnmatchedInboundReplyReviewStatus,
  number
>;

export type StrongUnmatchedReplyCandidate = {
  inquiryId: string;
  replyId: string;
  fromEmail: string;
  subject: string | null;
  createdAt: string;
};

export function buildUnmatchedReplyNotificationId(id: string) {
  return `unmatched-reply:${id}`;
}

export function extractUnmatchedReplyId(notificationId: string) {
  return notificationId.startsWith("unmatched-reply:")
    ? notificationId.slice("unmatched-reply:".length)
    : null;
}

export async function getUnmatchedInboundReplies(options?: {
  reviewStatus?: UnmatchedInboundReplyReviewStatus;
  limit?: number;
}) {
  let query = supabaseAdmin
    .from("unmatched_inbound_email_replies")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.reviewStatus) {
    query = query.eq("review_status", options.reviewStatus);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as UnmatchedInboundReply[];
}

export async function getUnmatchedInboundReplyById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("unmatched_inbound_email_replies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as UnmatchedInboundReply | null;
}

export async function getUnmatchedInboundReplyCounts() {
  const replies = await getUnmatchedInboundReplies();
  return replies.reduce<UnmatchedInboundReplyCounts>(
    (counts, reply) => {
      counts[reply.review_status] += 1;
      return counts;
    },
    {
      pending_review: 0,
      resolved: 0,
      ignored: 0,
    }
  );
}

export async function getUnmatchedReplyNotifications(adminId: string, limit = 24) {
  const replies = await getUnmatchedInboundReplies({
    reviewStatus: "pending_review",
    limit,
  });

  const replyIds = replies.map((reply) => reply.id);
  const { data: readRows, error: readError } = replyIds.length
    ? await supabaseAdmin
        .from("admin_unmatched_reply_reads")
        .select("unmatched_reply_id")
        .eq("admin_id", adminId)
        .in("unmatched_reply_id", replyIds)
    : { data: [], error: null };

  if (readError) {
    throw new Error(readError.message);
  }

  const readSet = new Set((readRows ?? []).map((row) => row.unmatched_reply_id));

  const items: UnmatchedReplyNotificationItem[] = replies.map((reply) => ({
    id: buildUnmatchedReplyNotificationId(reply.id),
    created_at: reply.created_at,
    is_read: readSet.has(reply.id),
    reply,
  }));

  return {
    items,
    unreadCount: items.filter((item) => !item.is_read).length,
  };
}

export async function getStrongUnmatchedReplyCandidatesByInquiry(
  inquiries: Array<{ id: string; email: string | null | undefined }>
) {
  const normalizedInquiries = inquiries
    .map((item) => ({
      id: item.id,
      email: item.email?.trim().toLowerCase() ?? null,
    }))
    .filter((item): item is { id: string; email: string } => Boolean(item.email));

  const uniqueEmails = [...new Set(normalizedInquiries.map((item) => item.email))];

  if (!uniqueEmails.length) {
    return {} as Record<string, StrongUnmatchedReplyCandidate[]>;
  }

  const [pendingReplies, inquiryRowsResult] = await Promise.all([
    supabaseAdmin
      .from("unmatched_inbound_email_replies")
      .select("id, from_email, subject, created_at")
      .eq("review_status", "pending_review")
      .in("from_email", uniqueEmails)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("event_inquiries")
      .select("id, email")
      .in("email", uniqueEmails),
  ]);

  if (pendingReplies.error) {
    throw new Error(pendingReplies.error.message);
  }

  if (inquiryRowsResult.error) {
    throw new Error(inquiryRowsResult.error.message);
  }

  const inquiryIdsByEmail = new Map<string, string[]>();
  for (const row of inquiryRowsResult.data ?? []) {
    const email = row.email?.trim().toLowerCase();
    if (!email) continue;
    inquiryIdsByEmail.set(email, [...(inquiryIdsByEmail.get(email) ?? []), row.id]);
  }

  const replyCandidatesByInquiry = normalizedInquiries.reduce<
    Record<string, StrongUnmatchedReplyCandidate[]>
  >((acc, item) => {
    acc[item.id] = [];
    return acc;
  }, {});

  for (const reply of pendingReplies.data ?? []) {
    const candidateInquiryIds = inquiryIdsByEmail.get(reply.from_email) ?? [];
    if (candidateInquiryIds.length !== 1) {
      continue;
    }

    const inquiryId = candidateInquiryIds[0];
    if (!replyCandidatesByInquiry[inquiryId]) {
      continue;
    }

    replyCandidatesByInquiry[inquiryId].push({
      inquiryId,
      replyId: reply.id,
      fromEmail: reply.from_email,
      subject: reply.subject,
      createdAt: reply.created_at,
    });
  }

  return replyCandidatesByInquiry;
}
