import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { isAdminWorkspaceRole } from "@/lib/admin-access";

async function getAdminProfile(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("crm_profiles")
    .select("id, role, is_active, allowed_modules, full_name")
    .eq("id", userId)
    .maybeSingle();

  return profile;
}

export async function requireAdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const profile = await getAdminProfile(user.id);

  if (!profile || !isAdminWorkspaceRole(profile.role) || !profile.is_active) {
    redirect("/admin/login");
  }

  return { user, profile };
}

export async function requireAdminApi() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      profile: null,
    };
  }

  const profile = await getAdminProfile(user.id);

  if (!profile || !isAdminWorkspaceRole(profile.role) || !profile.is_active) {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user,
      profile: null,
    };
  }

  return { errorResponse: null, user, profile };
}
