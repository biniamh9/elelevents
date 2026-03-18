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

  return (
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h1>Manage the quote pricing catalog</h1>
        <p className="lead">
          Keep the reusable decor pricing clean so every inquiry can move into
          an itemized quote without rebuilding prices from scratch.
        </p>
      </div>

      {error ? <p className="error">Failed to load pricing catalog: {error.message}</p> : null}
      <PricingCatalogManagement items={data ?? []} />
    </main>
  );
}
