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
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Packages</p>
        <h1>Manage public packages</h1>
        <p className="lead">
          Keep the package list clean, update package details, hide anything you
          no longer want public, or delete a package entirely.
        </p>
      </div>

      {error ? <p className="error">Failed to load packages: {error.message}</p> : null}
      <PackageManagement items={data ?? []} />
    </main>
  );
}
