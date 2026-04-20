import TestimonialManagement from "@/components/forms/admin/testimonial-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  await requireAdminPage("content");

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select(
      "id, reviewer_name, source_label, rating, quote, highlight, event_type, is_featured, sort_order, is_active"
    )
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const totalTestimonials = data?.length ?? 0;
  const activeTestimonials = data?.filter((item) => item.is_active).length ?? 0;
  const featuredTestimonials = data?.filter((item) => item.is_featured).length ?? 0;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Testimonials</p>
          <h1>Manage homepage reviews</h1>
          <p className="lead">
          Paste real Google reviews here, keep the full wording for records, and
          choose a cleaner highlight for the homepage.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total reviews: {totalTestimonials}</span>
          <span className="admin-head-pill">Active: {activeTestimonials}</span>
          <span className="admin-head-pill">Featured: {featuredTestimonials}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Keep only the strongest social proof visible so the homepage stays polished.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total reviews</p>
            <strong>{totalTestimonials}</strong>
            <span>Saved records</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Active reviews</p>
            <strong>{activeTestimonials}</strong>
            <span>Visible options</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Featured</p>
            <strong>{featuredTestimonials}</strong>
            <span>Homepage highlights</span>
          </div>
        </div>
      </section>

      {error ? (
        <p className="error">Failed to load testimonials: {error.message}</p>
      ) : null}
      <TestimonialManagement items={data ?? []} />
    </main>
  );
}
