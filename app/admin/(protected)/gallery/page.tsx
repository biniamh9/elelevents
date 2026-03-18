import GalleryManagement from "@/components/forms/admin/gallery-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
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
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Gallery</p>
          <h1>Manage gallery images</h1>
          <p className="lead">
            Upload images, control public visibility, and keep the portfolio clean.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total images: {totalImages}</span>
          <span className="admin-head-pill">Visible: {visibleImages}</span>
          <span className="admin-head-pill">Categories: {categoryCount}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Quick counts only. Manage the actual gallery records in the table below.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total images</p>
            <strong>{totalImages}</strong>
            <span>All gallery assets</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Visible images</p>
            <strong>{visibleImages}</strong>
            <span>Shown publicly</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Hidden images</p>
            <strong>{hiddenImages}</strong>
            <span>Not shown publicly</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Categories</p>
            <strong>{categoryCount}</strong>
            <span>Distinct gallery groups</span>
          </div>
        </div>
      </section>

      {error ? <p className="error">Failed to load gallery items: {error.message}</p> : null}
      <GalleryManagement items={data ?? []} />
    </main>
  );
}
