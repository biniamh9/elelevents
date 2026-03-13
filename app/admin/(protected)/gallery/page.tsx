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
    <main className="container section">
      <h2>Gallery Management</h2>
      <p className="lead">
        Upload images, control public visibility, and manage gallery order.
      </p>

      {error ? <p className="error">Failed to load gallery items: {error.message}</p> : null}
      <GalleryManagement items={data ?? []} />
    </main>
  );
}
