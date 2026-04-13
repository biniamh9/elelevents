import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { ADMIN_ROLES, normalizeModuleAccess, type AdminRole } from "@/lib/admin-access";
import { getAdminWorkspaceUsers } from "@/lib/admin-users";

export async function GET() {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  const users = await getAdminWorkspaceUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const role = typeof body.role === "string" ? body.role : "staff";
  const allowedModules = normalizeModuleAccess(
    role,
    Array.isArray(body.allowed_modules) ? body.allowed_modules : []
  );

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : undefined,
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ""}/admin/login`,
  });

  if (inviteResult.error || !inviteResult.data.user) {
    return NextResponse.json(
      { error: inviteResult.error?.message || "Unable to invite user." },
      { status: 400 }
    );
  }

  const invitedUser = inviteResult.data.user;
  const { error: profileError } = await supabaseAdmin.from("crm_profiles").upsert({
    id: invitedUser.id,
    full_name: fullName || invitedUser.user_metadata?.full_name || null,
    role,
    is_active: true,
    allowed_modules: allowedModules,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
