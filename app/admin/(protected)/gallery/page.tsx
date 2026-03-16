import GalleryManagement from "@/components/forms/admin/gallery-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const { data, error } = await supabaseAdmin
    .from("gallery_items")
    .select("id, title, category, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Gallery</p>
        <h1>Manage gallery images</h1>
        <p className="lead">
          Upload images, control public visibility, and keep the portfolio clean.
        </p>
      </div>

      {error ? <p className="error">Failed to load gallery items: {error.message}</p> : null}
      <GalleryManagement items={data ?? []} />
    </main>
  );
}
