import PackageManagement from "@/components/forms/admin/package-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const { data, error } = await supabaseAdmin
    .from("packages")
    .select("id, name, best_for, summary, features, featured, sort_order, is_active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const totalPackages = data?.length ?? 0;
  const livePackages = data?.filter((item) => item.is_active).length ?? 0;
  const featuredPackages = data?.filter((item) => item.featured).length ?? 0;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Packages</p>
          <h1>Manage public packages</h1>
          <p className="lead">
          Keep the package list clean, update package details, hide anything you
          no longer want public, or delete a package entirely.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total packages: {totalPackages}</span>
          <span className="admin-head-pill">Live: {livePackages}</span>
          <span className="admin-head-pill">Featured: {featuredPackages}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Keep the offer list focused so clients see only the most useful options.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total packages</p>
            <strong>{totalPackages}</strong>
            <span>Configured offer tiers</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Live packages</p>
            <strong>{livePackages}</strong>
            <span>Visible to clients</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Featured</p>
            <strong>{featuredPackages}</strong>
            <span>Highlighted publicly</span>
          </div>
        </div>
      </section>

      {error ? <p className="error">Failed to load packages: {error.message}</p> : null}
      <PackageManagement items={data ?? []} />
    </main>
  );
}
