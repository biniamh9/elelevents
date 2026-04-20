import Link from "next/link";
import { getAdminWorkspaceUsers } from "@/lib/admin-users";
import AdminUserManagement from "@/components/forms/admin/admin-user-management";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import WorkspaceSettingsForm from "@/components/forms/admin/workspace-settings-form";
import { requireAdminPage } from "@/lib/auth/admin";
import {
  getWorkspaceModuleSummaries,
  getWorkspaceRoleSummaries,
  getWorkspaceSettings,
} from "@/lib/workspace-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage("settings");

  const { tab = "access" } = await searchParams;
  const users = tab === "users" ? await getAdminWorkspaceUsers() : [];
  const workspaceSettings = tab === "workspace" ? await getWorkspaceSettings() : null;
  const roleSummaries = tab === "access" ? await getWorkspaceRoleSummaries() : [];
  const moduleSummaries = tab === "modules" ? await getWorkspaceModuleSummaries() : [];

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
      ) : tab === "workspace" && workspaceSettings ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card">
            <AdminSectionHeader
              title="Workspace defaults"
              description="Define the business identity and default admin settings so this system can be reused for other business types without code changes."
            />
            <WorkspaceSettingsForm initialSettings={workspaceSettings} />
          </section>

          <aside className="card admin-section-card">
            <AdminSectionHeader
              title="Current defaults"
              description="These values drive the admin workspace baseline."
            />
            <div className="admin-mini-metrics admin-mini-metrics--plain">
              <div>
                <strong>{workspaceSettings.business_name}</strong>
                <span>{workspaceSettings.business_type}</span>
              </div>
              <div>
                <strong>{workspaceSettings.default_currency}</strong>
                <span>{workspaceSettings.default_timezone}</span>
              </div>
              <div>
                <strong>{workspaceSettings.support_email ?? "No support email set"}</strong>
                <span>{workspaceSettings.support_phone ?? "No support phone set"}</span>
              </div>
            </div>
          </aside>
        </div>
      ) : tab === "access" ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card">
            <AdminSectionHeader
              title="Role access planning"
              description="Set up role-level access for finance, contracts, gallery, vendors, and general admin oversight."
            />
            {roleSummaries.length ? (
              <div className="admin-record-table-shell">
                <table className="admin-records-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Users</th>
                      <th>Active</th>
                      <th>Module access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleSummaries.map((summary) => (
                      <tr key={summary.role}>
                        <td>{summary.role}</td>
                        <td>{summary.userCount}</td>
                        <td>{summary.activeCount}</td>
                        <td>{summary.modules.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <AdminEmptyState
                title="No role access data"
                description="User access summaries will appear here once workspace users are present."
              />
            )}
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
      ) : tab === "modules" ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card">
            <AdminSectionHeader
              title="Module controls"
              description="Control which sections appear for finance, contracts, content, and operations roles."
            />
            {moduleSummaries.length ? (
              <div className="admin-record-table-shell">
                <table className="admin-records-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Users</th>
                      <th>Active users</th>
                      <th>Roles using module</th>
                      <th>Default roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleSummaries.map((summary) => (
                      <tr key={summary.module}>
                        <td>{summary.module}</td>
                        <td>{summary.userCount}</td>
                        <td>{summary.activeUserCount}</td>
                        <td>{summary.rolesUsingModule.join(", ") || "—"}</td>
                        <td>{summary.defaultRoles.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <AdminEmptyState
                title="No module data"
                description="Module summaries will appear here once users and roles are configured."
              />
            )}
          </section>

          <aside className="card admin-section-card">
            <AdminSectionHeader
              title="How to use modules"
              description="Keep workspace access narrow so each business type can reuse the same core admin safely."
            />
            <div className="admin-mini-metrics admin-mini-metrics--plain">
              <div>
                <strong>Overview</strong>
                <span>Executive snapshot and core operating lane.</span>
              </div>
              <div>
                <strong>CRM / Sales / Finance</strong>
                <span>Separate pipeline, documents, and actual cash so meanings do not overlap.</span>
              </div>
              <div>
                <strong>Content / Operations / Settings</strong>
                <span>Grant only when the user needs those responsibilities.</span>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
