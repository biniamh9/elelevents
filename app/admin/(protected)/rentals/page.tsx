import Link from "next/link";

import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import RentalManagement from "@/components/forms/admin/rental-management";
import { requireAdminPage } from "@/lib/auth/admin";
import { getRentalItems } from "@/lib/rentals";

export const dynamic = "force-dynamic";

export default async function AdminRentalsPage() {
  await requireAdminPage("sales");

  const items = await getRentalItems();
  const activeCount = items.filter((item) => item.active).length;
  const featuredCount = items.filter((item) => item.featured).length;
  const categoryCount = new Set(items.map((item) => item.category).filter(Boolean)).size;
  const totalUnits = items.reduce((sum, item) => sum + item.available_quantity, 0);

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Rentals"
        description="Manage rentable inventory, service fees, and public rental visibility from one organized workspace."
        aside={<Link href="/admin/rentals/new" className="btn">New rental item</Link>}
      />

      <AdminMetricStrip
        items={[
          { label: "Total items", value: items.length, note: "All rental records" },
          { label: "Active items", value: activeCount, note: "Visible publicly" },
          { label: "Featured items", value: featuredCount, note: "Priority merchandising" },
          { label: "Categories", value: categoryCount, note: "Distinct rental groups" },
          { label: "Available units", value: totalUnits, note: "Current available quantity" },
        ]}
      />

      <RentalManagement items={items} />
    </main>
  );
}
