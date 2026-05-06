import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { ADMIN_MODULES, ADMIN_ROLES, DEFAULT_MODULE_ACCESS, type AdminModule, type AdminRole } from "@/lib/admin-access";
import { getAdminWorkspaceUsers } from "@/lib/admin-users";

export type WorkspaceSettings = {
  id: string;
  business_name: string;
  business_type: string;
  workspace_label: string;
  support_email: string | null;
  support_phone: string | null;
  default_currency: string;
  default_timezone: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRoleSummary = {
  role: AdminRole;
  userCount: number;
  activeCount: number;
  modules: AdminModule[];
};

export type WorkspaceModuleSummary = {
  module: AdminModule;
  userCount: number;
  activeUserCount: number;
  rolesUsingModule: AdminRole[];
  defaultRoles: AdminRole[];
};

export type WorkspaceSettingsResult = {
  settings: WorkspaceSettings;
  schemaReady: boolean;
};

const DEFAULT_SETTINGS: Omit<WorkspaceSettings, "id" | "created_at" | "updated_at"> = {
  business_name: "Elel Events",
  business_type: "Luxury event design",
  workspace_label: "Admin workspace",
  support_email: null,
  support_phone: null,
  default_currency: "USD",
  default_timezone: "America/New_York",
};

export function buildDefaultWorkspaceSettings(): WorkspaceSettings {
  const now = new Date().toISOString();
  return {
    id: "default",
    ...DEFAULT_SETTINGS,
    created_at: now,
    updated_at: now,
  };
}

export function isMissingWorkspaceSettingsSchema(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("admin_workspace_settings") &&
    (normalized.includes("does not exist") ||
      normalized.includes("schema cache") ||
      normalized.includes("could not find"))
  );
}

export async function getWorkspaceSettingsResult(): Promise<WorkspaceSettingsResult> {
  const { data, error } = await supabaseAdmin
    .from("admin_workspace_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    if (isMissingWorkspaceSettingsSchema(error.message)) {
      return {
        settings: buildDefaultWorkspaceSettings(),
        schemaReady: false,
      };
    }
    throw new Error(error.message);
  }

  if (!data) {
    return {
      settings: buildDefaultWorkspaceSettings(),
      schemaReady: true,
    };
  }

  return {
    settings: data as WorkspaceSettings,
    schemaReady: true,
  };
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const result = await getWorkspaceSettingsResult();
  return result.settings;
}

export async function getWorkspaceRoleSummaries(): Promise<WorkspaceRoleSummary[]> {
  const users = await getAdminWorkspaceUsers();
  return ADMIN_ROLES.map((role) => {
    const roleUsers = users.filter((user) => user.role === role);
    return {
      role,
      userCount: roleUsers.length,
      activeCount: roleUsers.filter((user) => user.is_active).length,
      modules: DEFAULT_MODULE_ACCESS[role],
    };
  });
}

export async function getWorkspaceModuleSummaries(): Promise<WorkspaceModuleSummary[]> {
  const users = await getAdminWorkspaceUsers();
  return ADMIN_MODULES.map((module) => {
    const moduleUsers = users.filter((user) => user.allowed_modules.includes(module));
    const rolesUsingModule = Array.from(
      new Set(moduleUsers.map((user) => user.role))
    ) as AdminRole[];

    return {
      module,
      userCount: moduleUsers.length,
      activeUserCount: moduleUsers.filter((user) => user.is_active).length,
      rolesUsingModule,
      defaultRoles: ADMIN_ROLES.filter((role) => DEFAULT_MODULE_ACCESS[role].includes(module)),
    };
  });
}
