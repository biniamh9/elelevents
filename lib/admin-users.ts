import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { normalizeModuleAccess, type AdminRole } from "@/lib/admin-access";

export type AdminWorkspaceUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  allowed_modules: string[];
  created_at: string;
  last_sign_in_at: string | null;
};

export async function getAdminWorkspaceUsers(): Promise<AdminWorkspaceUser[]> {
  const [{ data: profiles }, authUsersResult] = await Promise.all([
    supabaseAdmin
      .from("crm_profiles")
      .select("id, full_name, role, is_active, allowed_modules, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const authUsers = authUsersResult.data?.users ?? [];
  const authMap = new Map(authUsers.map((user) => [user.id, user]));

  return (profiles ?? []).map((profile) => {
    const authUser = authMap.get(profile.id);
    const role = profile.role as AdminRole;

    return {
      id: profile.id,
      email: authUser?.email ?? "No email found",
      full_name: profile.full_name,
      role,
      is_active: Boolean(profile.is_active),
      allowed_modules: normalizeModuleAccess(role, profile.allowed_modules ?? []),
      created_at: profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });
}
