"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AdminNotificationItem } from "@/lib/admin-notifications";

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

function buildNotificationLink(item: AdminNotificationItem) {
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

function humanizeSummary(item: AdminNotificationItem) {
  if (item.action === "inquiry.created") {
    return "New quote request submitted";
  }
  if (item.action === "inquiry.reply_received") {
    return "Lead replied by email";
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

export default function AdminNotificationBellClient({
  initialItems,
  initialUnreadCount,
}: {
  initialItems: AdminNotificationItem[];
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const [items, setItems] = useState(initialItems);
  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length || initialUnreadCount,
    [items, initialUnreadCount]
  );

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  async function markRead(activityIds: string[]) {
    if (!activityIds.length) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        activityIds.includes(item.id) ? { ...item, is_read: true } : item
      )
    );

    await fetch("/api/admin/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityIds }),
      keepalive: true,
    }).catch(() => undefined);
  }

  const hasUnread = items.some((item) => !item.is_read);

  return (
    <details ref={detailsRef} className="admin-notifications">
      <summary className="admin-notifications-trigger" aria-label="Recent activity">
        <span className="admin-notifications-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
        </span>
        {unreadCount > 0 ? (
          <span className="admin-notifications-count">{unreadCount > 9 ? "9+" : unreadCount}</span>
        ) : null}
      </summary>

      <div className="admin-notifications-panel card">
        <div className="admin-notifications-head">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h3>Customer-side updates</h3>
          </div>
          <small>Last 14 days</small>
        </div>

        {hasUnread ? (
          <button
            type="button"
            className="admin-notifications-markall"
            onClick={() => markRead(items.filter((item) => !item.is_read).map((item) => item.id))}
          >
            Mark all as read
          </button>
        ) : null}

        {items.length ? (
          <div className="admin-notifications-list">
            {items.map((item) => {
              const summary = humanizeSummary(item);
              return (
                <Link
                  key={item.id}
                  href={buildNotificationLink(item)}
                  className={`admin-notification-item${item.is_read ? "" : " is-unread"}`}
                  onClick={() => {
                    if (detailsRef.current) {
                      detailsRef.current.open = false;
                    }
                    if (!item.is_read) {
                      void markRead([item.id]);
                    }
                  }}
                >
                  <div>
                    <strong>{summary}</strong>
                    <span>
                      {item.summary && item.summary !== summary ? item.summary : "Open details"}
                    </span>
                  </div>
                  <small>{timeAgo(item.created_at)}</small>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="muted">No recent customer-side activity yet.</p>
        )}
      </div>
    </details>
  );
}
