import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getUnmatchedReplyNotifications } from "@/lib/unmatched-inbound-replies";

export const adminNotificationActions = [
  "inquiry.created",
  "inquiry.reply_received",
  "inquiry.quote_accepted",
  "inquiry.quote_changes_requested",
  "rental_request.created",
  "rental_request.status_updated",
  "vendor.applied",
  "vendor.signed_in",
  "vendor_referral.accepted",
  "vendor_referral.declined",
  "contract.docusign_webhook",
] as const;

export type AdminNotificationItem = {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  source?: "activity" | "unmatched_reply";
};

export async function getAdminNotifications(adminId: string) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: allRows, error }, unmatchedNotifications] = await Promise.all([
    supabaseAdmin
      .from("activity_log")
      .select("id, created_at, entity_type, entity_id, action, summary, metadata")
      .gte("created_at", since)
      .in("action", [...adminNotificationActions])
      .order("created_at", { ascending: false })
      .limit(24),
    getUnmatchedReplyNotifications(adminId, 24),
  ]);

  if (error || !allRows) {
    return {
      items: unmatchedNotifications.items.map((item): AdminNotificationItem => ({
        id: item.id,
        created_at: item.created_at,
        entity_type: "unmatched_inbound_email_reply",
        entity_id: item.reply.id,
        action: "inbound_email_reply.unmatched",
        summary: item.reply.subject,
        metadata: {
          from_email: item.reply.from_email,
          to_email: item.reply.to_email,
          match_reason: item.reply.match_reason,
          conversation_key: item.reply.conversation_key,
        },
        is_read: item.is_read,
        source: "unmatched_reply" as const,
      })),
      unreadCount: unmatchedNotifications.unreadCount,
    };
  }

  const ids = allRows.map((row) => row.id);

  const { data: readRows } = ids.length
    ? await supabaseAdmin
        .from("admin_notification_reads")
        .select("activity_id")
        .eq("admin_id", adminId)
        .in("activity_id", ids)
    : { data: [] };

  const readSet = new Set((readRows ?? []).map((row) => row.activity_id));

  const items = allRows.map((row) => ({
    ...(row as Omit<AdminNotificationItem, "is_read">),
    is_read: readSet.has(row.id),
    source: "activity" as const,
  }));

  const unmatchedItems = unmatchedNotifications.items.map((item): AdminNotificationItem => ({
    id: item.id,
    created_at: item.created_at,
    entity_type: "unmatched_inbound_email_reply",
    entity_id: item.reply.id,
    action: "inbound_email_reply.unmatched",
    summary: item.reply.subject,
    metadata: {
      from_email: item.reply.from_email,
      to_email: item.reply.to_email,
      match_reason: item.reply.match_reason,
      conversation_key: item.reply.conversation_key,
    },
    is_read: item.is_read,
    source: "unmatched_reply" as const,
  }));

  const merged = [...items, ...unmatchedItems]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 24);
  const unreadCount = merged.filter((item) => !item.is_read).length;

  return { items: merged, unreadCount };
}
