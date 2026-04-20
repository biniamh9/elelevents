import Link from "next/link";
import { getAdminWorkspaceUsers } from "@/lib/admin-users";
import AdminUserManagement from "@/components/forms/admin/admin-user-management";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage("settings");

  const { tab = "access" } = await searchParams;
  const users = tab === "users" ? await getAdminWorkspaceUsers() : [];

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Access and workspace controls"
        description="Prepare role-based access so finance, contracts, content, and inquiry workflows can be delegated without exposing every admin tool to everyone."
        aside={
          <>
            <span className="admin-head-pill">Role access roadmap</span>
            <span className="admin-head-pill">Settings workspace</span>
          </>
        }
      />

      <div className="admin-workspace-tabs admin-workspace-tabs--inline">
        <Link href="/admin/settings?tab=users" className={`admin-workspace-tab${tab === "users" ? " is-active" : ""}`}>
          Users
        </Link>
        <Link href="/admin/settings" className={`admin-workspace-tab${tab === "access" ? " is-active" : ""}`}>
          Access & Roles
        </Link>
        <Link href="/admin/settings?tab=workspace" className={`admin-workspace-tab${tab === "workspace" ? " is-active" : ""}`}>
          Workspace
        </Link>
        <Link href="/admin/settings?tab=modules" className={`admin-workspace-tab${tab === "modules" ? " is-active" : ""}`}>
          Modules
        </Link>
      </div>

      {tab === "users" ? (
        <AdminUserManagement initialUsers={users} />
      ) : (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card">
            <AdminSectionHeader
              title={tab === "workspace" ? "Workspace defaults" : tab === "modules" ? "Module controls" : "Role access planning"}
              description={
                tab === "workspace"
                  ? "Define shared admin behaviors and default workspace preferences."
                  : tab === "modules"
                  ? "Control which sections appear for finance, contracts, content, and operations roles."
                  : "Set up role-level access for finance, contracts, gallery, vendors, and general admin oversight."
              }
            />
            <div className="admin-placeholder-list">
              <div>
                <strong>Finance role</strong>
                <span>Access to invoices, receipts, payment history, and finance reporting only</span>
              </div>
              <div>
                <strong>Contracts role</strong>
                <span>Access to contracts, deposits, signatures, and booking progress</span>
              </div>
              <div>
                <strong>Content role</strong>
                <span>Access to gallery, testimonials, social links, and homepage flow</span>
              </div>
            </div>
          </section>

          <aside className="card admin-section-card">
            <AdminSectionHeader
              title="Recommended controls"
              description="Start with a small, clear permission model before expanding access."
            />
            <div className="admin-mini-metrics admin-mini-metrics--plain">
              <div>
                <strong>Read-only roles</strong>
                <span>Useful for finance review and reporting visibility</span>
              </div>
              <div>
                <strong>Module-level access</strong>
                <span>Limit each user to their workspace areas</span>
              </div>
              <div>
                <strong>Approval flow</strong>
                <span>Reserve deletion and pricing updates for primary admins</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
