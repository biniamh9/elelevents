import PackageManagement from "@/components/forms/admin/package-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const { data, error } = await supabaseAdmin
    .from("packages")
    .select("id, name, best_for, summary, features, featured, sort_order, is_active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className="container section">
      <h2>Package Management</h2>
      <p className="lead">
        Create, edit, feature, and archive public package content.
      </p>

      {error ? <p className="error">Failed to load packages: {error.message}</p> : null}
      <PackageManagement items={data ?? []} />
    </main>
  );
}
