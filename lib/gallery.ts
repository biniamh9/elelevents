import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type GalleryItem = {
  id: string;
  title: string;
  category: string | null;
  image_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

const fallbackGalleryItems: GalleryItem[] = [
  {
    id: "fallback-1",
    title: "Elegant Wedding Reception",
    category: "Wedding",
    image_url:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "fallback-2",
    title: "Luxury Table Setup",
    category: "Reception",
    image_url:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "fallback-3",
    title: "Birthday Celebration",
    category: "Birthday",
    image_url:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    sort_order: 3,
    is_active: true,
  },
];

export async function getGalleryItems(limit?: number) {
  let query = supabaseAdmin
    .from("gallery_items")
    .select("id, title, category, image_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return limit ? fallbackGalleryItems.slice(0, limit) : fallbackGalleryItems;
  }

  return data as GalleryItem[];
}
