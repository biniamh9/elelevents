"use client";

import { useMemo, useState } from "react";
import { ADMIN_MODULES, ADMIN_ROLES, DEFAULT_MODULE_ACCESS, type AdminRole } from "@/lib/admin-access";
import type { AdminWorkspaceUser } from "@/lib/admin-users";

type Props = {
  initialUsers: AdminWorkspaceUser[];
};

const moduleLabels: Record<(typeof ADMIN_MODULES)[number], string> = {
  overview: "Overview",
  sales: "Sales",
  finance: "Finance",
  operations: "Operations",
  content: "Content",
  settings: "Settings",
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUserManagement({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("staff");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      finance: users.filter((user) => user.role === "finance").length,
      contracts: users.filter((user) => user.role === "contracts").length,
    }),
    [users]
  );

  async function refreshUsers() {
    const response = await fetch("/api/admin/settings/users", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setUsers(payload.users ?? []);
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteBusy(true);
    setInviteMessage(null);

    const response = await fetch("/api/admin/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        allowed_modules: DEFAULT_MODULE_ACCESS[inviteRole],
      }),
    });

    const payload = await response.json();
    setInviteBusy(false);

    if (!response.ok) {
      setInviteMessage(payload.error || "Unable to invite user.");
      return;
    }

    setInviteEmail("");
    setInviteName("");
    setInviteRole("staff");
    setInviteMessage("Invite sent.");
    await refreshUsers();
  }

  async function saveUser(user: AdminWorkspaceUser) {
    setSavingId(user.id);

    const response = await fetch(`/api/admin/settings/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        allowed_modules: user.allowed_modules,
      }),
    });

    setSavingId(null);

    if (response.ok) {
      await refreshUsers();
    }
  }

  function updateUser(id: string, patch: Partial<AdminWorkspaceUser>) {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, ...patch } : user))
    );
  }

  return (
    <div className="admin-users-workspace">
      <div className="admin-inline-metrics">
        <div className="card">
          <span>Total users</span>
          <strong>{counts.total}</strong>
        </div>
        <div className="card">
          <span>Active</span>
          <strong>{counts.active}</strong>
        </div>
        <div className="card">
          <span>Finance access</span>
          <strong>{counts.finance}</strong>
        </div>
        <div className="card">
          <span>Contracts access</span>
          <strong>{counts.contracts}</strong>
        </div>
      </div>

      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <section className="card admin-section-card">
          <div className="admin-section-title">
            <h3>Add admin user</h3>
            <p className="muted">Invite a teammate, assign their role, and define the modules they can manage.</p>
          </div>
          <form className="admin-settings-form" onSubmit={handleInvite}>
            <div className="admin-dashboard-form-grid">
              <label>
                <span>Email</span>
                <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} type="email" required />
              </label>
              <label>
                <span>Full name</span>
                <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Role</span>
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as AdminRole)}>
                  {ADMIN_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-user-module-preview">
              {DEFAULT_MODULE_ACCESS[inviteRole].map((module) => (
                <span key={module} className="admin-head-pill">
                  {moduleLabels[module]}
                </span>
              ))}
            </div>
            <div className="admin-settings-form-actions">
              <button type="submit" className="btn" disabled={inviteBusy}>
                {inviteBusy ? "Sending..." : "Send invite"}
              </button>
              {inviteMessage ? <p className="muted">{inviteMessage}</p> : null}
            </div>
          </form>
        </section>

        <aside className="card admin-section-card">
          <div className="admin-section-title">
            <h3>Role guidance</h3>
            <p className="muted">Use module-based access first. Reserve admin for pricing, settings, and destructive actions.</p>
          </div>
          <div className="admin-mini-metrics admin-mini-metrics--plain">
            <div>
              <strong>Finance</strong>
              <span>Invoices, receipts, payments, reporting</span>
            </div>
            <div>
              <strong>Contracts</strong>
              <span>Quotes, contracts, booking progress</span>
            </div>
            <div>
              <strong>Content</strong>
              <span>Gallery, testimonials, social, homepage flow</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="card admin-section-card">
        <div className="admin-section-title">
          <h3>User profiles</h3>
          <p className="muted">Adjust access without forcing everyone into the full admin workspace.</p>
        </div>
        <div className="admin-users-list">
          {users.map((user) => (
            <article key={user.id} className="admin-user-card">
              <div className="admin-user-card-head">
                <div>
                  <strong>{user.full_name || user.email}</strong>
                  <span>{user.email}</span>
                </div>
                <span className={`admin-status-pill${user.is_active ? " is-live" : ""}`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="admin-dashboard-form-grid">
                <label>
                  <span>Role</span>
                  <select
                    value={user.role}
                    onChange={(event) => {
                      const role = event.target.value as AdminRole;
                      updateUser(user.id, {
                        role,
                        allowed_modules: DEFAULT_MODULE_ACCESS[role],
                      });
                    }}
                  >
                    {ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Full name</span>
                  <input
                    type="text"
                    value={user.full_name ?? ""}
                    onChange={(event) => updateUser(user.id, { full_name: event.target.value })}
                  />
                </label>

                <label className="admin-checkbox-row">
                  <input
                    type="checkbox"
                    checked={user.is_active}
                    onChange={(event) => updateUser(user.id, { is_active: event.target.checked })}
                  />
                  <span>Active account</span>
                </label>
              </div>

              <div className="admin-user-modules">
                {ADMIN_MODULES.map((module) => (
                  <label key={module} className="admin-module-chip">
                    <input
                      type="checkbox"
                      checked={user.allowed_modules.includes(module)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...new Set([...user.allowed_modules, module])]
                          : user.allowed_modules.filter((value) => value !== module);
                        updateUser(user.id, { allowed_modules: next });
                      }}
                    />
                    <span>{moduleLabels[module]}</span>
                  </label>
                ))}
              </div>

              <div className="admin-user-card-foot">
                <small>Added {formatDate(user.created_at)} · Last sign-in {formatDate(user.last_sign_in_at)}</small>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={savingId === user.id}
                  onClick={() => saveUser(user)}
                >
                  {savingId === user.id ? "Saving..." : "Save changes"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
