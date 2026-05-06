import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { buildDefaultWorkspaceSettings, isMissingWorkspaceSettingsSchema } from "@/lib/workspace-settings";

export async function GET() {
  const { errorResponse } = await requireAdminApi("settings");
  if (errorResponse) return errorResponse;

  const { data, error } = await supabaseAdmin
    .from("admin_workspace_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    if (isMissingWorkspaceSettingsSchema(error.message)) {
      return NextResponse.json({
        settings: buildDefaultWorkspaceSettings(),
        schemaReady: false,
        message: "Workspace settings table is not installed yet. Apply supabase.workspace-settings.sql.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data, schemaReady: true });
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdminApi("settings");
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const payload = {
    id: "default",
    business_name: typeof body.business_name === "string" ? body.business_name.trim() : "Elel Events",
    business_type: typeof body.business_type === "string" ? body.business_type.trim() : "Luxury event design",
    workspace_label: typeof body.workspace_label === "string" ? body.workspace_label.trim() : "Admin workspace",
    support_email: typeof body.support_email === "string" ? body.support_email.trim() || null : null,
    support_phone: typeof body.support_phone === "string" ? body.support_phone.trim() || null : null,
    default_currency: typeof body.default_currency === "string" ? body.default_currency.trim().toUpperCase() || "USD" : "USD",
    default_timezone: typeof body.default_timezone === "string" ? body.default_timezone.trim() || "America/New_York" : "America/New_York",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("admin_workspace_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    if (isMissingWorkspaceSettingsSchema(error.message)) {
      return NextResponse.json(
        {
          error: "Workspace settings cannot be saved until supabase.workspace-settings.sql is applied.",
          schemaReady: false,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
