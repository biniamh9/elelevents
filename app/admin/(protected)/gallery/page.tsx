import GalleryManagement from "@/components/forms/admin/gallery-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requireAdminPage("content");

  const { data, error } = await supabaseAdmin
    .from("gallery_items")
    .select("id, title, category, image_url, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const totalImages = data?.length ?? 0;
  const visibleImages = data?.filter((item) => item.is_active).length ?? 0;
  const hiddenImages = totalImages - visibleImages;
  const categoryCount = new Set(
    (data ?? []).map((item) => item.category).filter(Boolean)
  ).size;

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Gallery"
        description="Upload images, control public visibility, and keep the portfolio clean."
      />

      <AdminMetricStrip
        items={[
          { label: "Total images", value: totalImages, note: "All gallery assets" },
          { label: "Visible images", value: visibleImages, note: "Shown publicly" },
          { label: "Hidden images", value: hiddenImages, note: "Not shown publicly" },
          { label: "Categories", value: categoryCount, note: "Distinct gallery groups" },
        ]}
      />

      {error ? <p className="error">Failed to load gallery items: {error.message}</p> : null}
      <GalleryManagement items={data ?? []} />
    </main>
  );
}
