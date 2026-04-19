import PricingCatalogManagement from "@/components/forms/admin/pricing-catalog-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";

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
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Pricing catalog"
        description="Keep the reusable decor pricing clean so every inquiry can move into an itemized quote without rebuilding prices from scratch."
      />

      <AdminMetricStrip
        items={[
          { label: "Total items", value: totalItems, note: "All pricing records" },
          { label: "Active items", value: activeItems, note: "Visible in the quote builder" },
          { label: "Inactive items", value: inactiveItems, note: "Hidden from the quote builder" },
          { label: "Categories", value: categoryCount, note: "Distinct pricing groups" },
        ]}
      />
      {error ? <p className="error">Failed to load pricing catalog: {error.message}</p> : null}
      <PricingCatalogManagement items={data ?? []} />
    </main>
  );
}
