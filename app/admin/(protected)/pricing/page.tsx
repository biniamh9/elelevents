import PricingCatalogManagement from "@/components/forms/admin/pricing-catalog-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const { data, error } = await supabaseAdmin
    .from("pricing_catalog_items")
    .select("id, name, category, variant, unit_label, unit_price, is_active, notes, sort_order")
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  const totalItems = data?.length ?? 0;
  const activeItems = data?.filter((item) => item.is_active).length ?? 0;
  const inactiveItems = totalItems - activeItems;
  const categoryCount = new Set(
    (data ?? []).map((item) => item.category).filter(Boolean)
  ).size;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Manage the quote pricing catalog</h1>
          <p className="lead">
            Keep the reusable decor pricing clean so every inquiry can move into
            an itemized quote without rebuilding prices from scratch.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total items: {totalItems}</span>
          <span className="admin-head-pill">Active: {activeItems}</span>
          <span className="admin-head-pill">Categories: {categoryCount}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Quick metrics only. Manage the actual pricing records in the table below.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total items</p>
            <strong>{totalItems}</strong>
            <span>All pricing records</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Active items</p>
            <strong>{activeItems}</strong>
            <span>Visible in the quote builder</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Inactive items</p>
            <strong>{inactiveItems}</strong>
            <span>Hidden from the quote builder</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Categories</p>
            <strong>{categoryCount}</strong>
            <span>Distinct pricing groups</span>
          </div>
        </div>
      </section>
      {error ? <p className="error">Failed to load pricing catalog: {error.message}</p> : null}
      <PricingCatalogManagement items={data ?? []} />
    </main>
  );
}
