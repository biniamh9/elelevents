export const ADMIN_ROLES = [
  "admin",
  "staff",
  "finance",
  "contracts",
  "content",
  "operations",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_MODULES = [
  "overview",
  "sales",
  "finance",
  "operations",
  "content",
  "settings",
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];

export const DEFAULT_MODULE_ACCESS: Record<AdminRole, AdminModule[]> = {
  admin: [...ADMIN_MODULES],
  staff: ["overview", "sales", "operations", "content"],
  finance: ["overview", "finance", "sales"],
  contracts: ["overview", "sales"],
  content: ["overview", "content"],
  operations: ["overview", "operations"],
};

export function isAdminWorkspaceRole(role: string | null | undefined): role is AdminRole {
  return Boolean(role && ADMIN_ROLES.includes(role as AdminRole));
}

export function normalizeModuleAccess(
  role: string | null | undefined,
  modules: string[] | null | undefined
): AdminModule[] {
  const fallback = isAdminWorkspaceRole(role) ? DEFAULT_MODULE_ACCESS[role] : [];

  if (!modules?.length) {
    return fallback;
  }

  const normalized = modules.filter((value): value is AdminModule =>
    ADMIN_MODULES.includes(value as AdminModule)
  );

  return normalized.length ? normalized : fallback;
}

export function canAccessModule(
  role: string | null | undefined,
  allowedModules: string[] | null | undefined,
  module: AdminModule
) {
  if (role === "admin") {
    return true;
  }

  return normalizeModuleAccess(role, allowedModules).includes(module);
}
