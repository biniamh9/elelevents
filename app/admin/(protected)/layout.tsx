import { Suspense } from "react";
import { requireAdminPage } from "@/lib/auth/admin";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminWorkspaceHeader from "@/components/admin/admin-workspace-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdminPage();

  return (
    <div className="container admin-shell">
      <Suspense fallback={<aside className="admin-sidebar-shell" />}>
        <AdminSidebar
          userEmail={user.email}
          userRole={profile.role}
          allowedModules={profile.allowed_modules ?? []}
        />
      </Suspense>

      <div className="admin-main">
        <Suspense fallback={<div className="admin-topbar" />}>
          <AdminWorkspaceHeader adminId={user.id} />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
