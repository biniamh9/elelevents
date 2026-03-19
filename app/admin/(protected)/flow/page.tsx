import HomeProcessManagement from "@/components/forms/admin/home-process-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminFlowPage() {
  const { data, error } = await supabaseAdmin
    .from("homepage_process_steps")
    .select("id, title, text, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true, nullsFirst: false });

  const totalSteps = data?.length ?? 0;
  const visibleSteps = data?.filter((item) => item.is_active).length ?? 0;
  const imageCount = data?.filter((item) => item.image_url).length ?? 0;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Homepage Flow</p>
          <h1>Manage homepage process content</h1>
          <p className="lead">
            Update the process step titles, descriptions, and images shown on the homepage.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Steps: {totalSteps}</span>
          <span className="admin-head-pill">Visible: {visibleSteps}</span>
          <span className="admin-head-pill">With images: {imageCount}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Keep this to five clean steps so the homepage stays focused.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total steps</p>
            <strong>{totalSteps}</strong>
            <span>Configured homepage flow items</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Visible steps</p>
            <strong>{visibleSteps}</strong>
            <span>Shown on the homepage</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Steps with images</p>
            <strong>{imageCount}</strong>
            <span>Used in the reveal panel</span>
          </div>
        </div>
      </section>

      {error ? <p className="error">Failed to load homepage flow steps: {error.message}</p> : null}
      <HomeProcessManagement items={data ?? []} />
    </main>
  );
}
