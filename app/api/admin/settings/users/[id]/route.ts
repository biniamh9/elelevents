import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { ADMIN_ROLES, normalizeModuleAccess, type AdminRole } from "@/lib/admin-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.full_name === "string") {
    updates.full_name = body.full_name.trim() || null;
  }

  if (typeof body.role === "string") {
    if (!ADMIN_ROLES.includes(body.role as AdminRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    updates.role = body.role;
    updates.allowed_modules = normalizeModuleAccess(
      body.role,
      Array.isArray(body.allowed_modules) ? body.allowed_modules : []
    );
  } else if (Array.isArray(body.allowed_modules)) {
    const { data: existing } = await supabaseAdmin
      .from("crm_profiles")
      .select("role")
      .eq("id", id)
      .maybeSingle();

    updates.allowed_modules = normalizeModuleAccess(existing?.role, body.allowed_modules);
  }

  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from("crm_profiles").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
