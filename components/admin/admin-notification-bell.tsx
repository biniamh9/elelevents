import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type NotificationRow = {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string | null;
  metadata: Record<string, unknown> | null;
};

function timeAgo(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function buildNotificationLink(item: NotificationRow) {
  if (item.action === "inquiry.created" || item.entity_type === "inquiry") {
    return `/admin/inquiries/${item.entity_id}`;
  }

  if (item.action.startsWith("vendor.") || item.entity_type === "vendor") {
    return "/admin/vendors";
  }

  if (item.action.startsWith("vendor_referral.")) {
    const inquiryId =
      item.metadata && typeof item.metadata.inquiry_id === "string"
        ? item.metadata.inquiry_id
        : null;

    return inquiryId ? `/admin/inquiries/${inquiryId}` : "/admin/vendors";
  }

  if (item.entity_type === "contract") {
    return `/admin/contracts/${item.entity_id}`;
  }

  return "/admin/inquiries";
}

function humanizeSummary(item: NotificationRow) {
  if (item.action === "inquiry.created") {
    return "New quote request submitted";
  }

  if (item.action === "vendor.applied") {
    return "New vendor application";
  }

  if (item.action === "vendor.signed_in") {
    return "Vendor signed in";
  }

  if (item.action === "vendor_referral.accepted") {
    return "Vendor accepted a referral";
  }

  if (item.action === "vendor_referral.declined") {
    return "Vendor declined a referral";
  }

  if (item.action === "contract.docusign_webhook") {
    return item.summary || "Contract activity updated";
  }

  return item.summary || item.action;
}

export default async function AdminNotificationBell() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("activity_log")
    .select("id, created_at, entity_type, entity_id, action, summary, metadata")
    .gte("created_at", since)
    .in("action", [
      "inquiry.created",
      "vendor.applied",
      "vendor.signed_in",
      "vendor_referral.accepted",
      "vendor_referral.declined",
      "contract.docusign_webhook",
    ])
    .order("created_at", { ascending: false })
    .limit(8);

  const items = (data ?? []) as NotificationRow[];
  const count = items.length;

  return (
    <details className="admin-notifications">
      <summary className="admin-notifications-trigger" aria-label="Recent activity">
        <span className="admin-notifications-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
        </span>
        {count > 0 ? <span className="admin-notifications-count">{count > 9 ? "9+" : count}</span> : null}
      </summary>

      <div className="admin-notifications-panel card">
        <div className="admin-notifications-head">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h3>Customer-side updates</h3>
          </div>
          <small>Last 7 days</small>
        </div>

        {items.length ? (
          <div className="admin-notifications-list">
            {items.map((item) => (
              <Link
                key={item.id}
                href={buildNotificationLink(item)}
                className="admin-notification-item"
              >
                <div>
                  <strong>{humanizeSummary(item)}</strong>
                  <span>{item.summary && item.summary !== humanizeSummary(item) ? item.summary : "Open details"}</span>
                </div>
                <small>{timeAgo(item.created_at)}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No recent customer-side activity yet.</p>
        )}
      </div>
    </details>
  );
}
