import TestimonialManagement from "@/components/forms/admin/testimonial-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select(
      "id, reviewer_name, source_label, rating, quote, highlight, event_type, is_featured, sort_order, is_active"
    )
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Testimonials</p>
        <h1>Manage homepage reviews</h1>
        <p className="lead">
          Paste real Google reviews here, keep the full wording for records, and
          choose a cleaner highlight for the homepage.
        </p>
      </div>

      {error ? (
        <p className="error">Failed to load testimonials: {error.message}</p>
      ) : null}
      <TestimonialManagement items={data ?? []} />
    </main>
  );
}
