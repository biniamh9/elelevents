import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/forms/admin/admin-login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { isAdminWorkspaceRole } from "@/lib/admin-access";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("crm_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && isAdminWorkspaceRole(profile.role) && profile.is_active) {
      redirect("/admin/inquiries");
    }
  }

  return (
    <main className="container section">
      <AdminLoginForm />
    </main>
  );
}
