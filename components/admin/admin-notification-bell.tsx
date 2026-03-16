import AdminNotificationBellClient from "@/components/admin/admin-notification-bell-client";
import { getAdminNotifications } from "@/lib/admin-notifications";

export default async function AdminNotificationBell({
  adminId,
}: {
  adminId: string;
}) {
  const { items, unreadCount } = await getAdminNotifications(adminId);

  return (
    <AdminNotificationBellClient
      initialItems={items}
      initialUnreadCount={unreadCount}
    />
  );
}
