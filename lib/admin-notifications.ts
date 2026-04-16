import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const adminNotificationActions = [
  "inquiry.created",
  "inquiry.reply_received",
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
};

export async function getAdminNotifications(adminId: string) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allRows, error } = await supabaseAdmin
    .from("activity_log")
    .select("id, created_at, entity_type, entity_id, action, summary, metadata")
    .gte("created_at", since)
    .in("action", [...adminNotificationActions])
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !allRows) {
    return { items: [] as AdminNotificationItem[], unreadCount: 0 };
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
  }));

  const unreadCount = items.filter((item) => !item.is_read).length;

  return { items, unreadCount };
}
