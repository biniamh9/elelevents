import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type GalleryItem = {
  id: string;
  title: string;
  category: string | null;
  image_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export type PortfolioGallerySection = {
  title: string;
  description: string;
  items: GalleryItem[];
};

export type PortfolioDetail = {
  item: GalleryItem;
  title: string;
  categoryLabel: string;
  location: string;
  styleTag: string;
  guestCount: string;
  description: string;
  sections: PortfolioGallerySection[];
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

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) =>
      part.length <= 3 && part === part.toUpperCase()
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

export function normalizeGalleryTitle(value: string | null | undefined, fallback = "Featured Event") {
  if (!value) return fallback;
  return toTitleCase(value);
}

export function normalizeGalleryCategory(value: string | null | undefined, fallback = "Celebration") {
  if (!value) return fallback;
  return toTitleCase(value)
    .replace(/\bMelsi\b/g, "Traditional Melsi")
    .replace(/\bBabyshower\b/g, "Baby Shower")
    .replace(/\bBride Shower\b/g, "Bridal Shower");
}

function deriveStyleTag(source: string) {
  const lowered = source.toLowerCase();
  if (lowered.includes("traditional") || lowered.includes("melsi")) return "Cultural Editorial";
  if (lowered.includes("baby")) return "Soft Luxury";
  if (lowered.includes("birthday")) return "Modern Celebration";
  if (lowered.includes("bridal")) return "Romantic Garden";
  if (lowered.includes("wedding")) return "Timeless Romance";
  return "Luxury Celebration";
}

function deriveLocation(category: string) {
  if (category.includes("Wedding")) return "Atlanta, Georgia";
  if (category.includes("Traditional")) return "Metro Atlanta";
  if (category.includes("Corporate")) return "Buckhead, Atlanta";
  return "Greater Atlanta";
}

function deriveGuestCount(category: string) {
  if (category.includes("Wedding")) return "180 guests";
  if (category.includes("Corporate")) return "220 guests";
  if (category.includes("Traditional")) return "250 guests";
  if (category.includes("Baby")) return "75 guests";
  return "120 guests";
}

function buildSection(title: string, description: string, items: GalleryItem[]): PortfolioGallerySection {
  return {
    title,
    description,
    items,
  };
}

export async function getGalleryItemById(id: string) {
  const items = await getGalleryItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function getPortfolioDetailById(id: string): Promise<PortfolioDetail | null> {
  const items = await getGalleryItems();
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return null;
  }

  const categoryLabel = normalizeGalleryCategory(item.category);
  const title = normalizeGalleryTitle(item.title);
  const sameCategory = items.filter((entry) => entry.category === item.category && entry.id !== item.id);
  const fallbackItems = items.filter((entry) => entry.id !== item.id);
  const sourceItems = (sameCategory.length >= 6 ? sameCategory : fallbackItems).slice(0, 6);

  const sections = [
    buildSection(
      "Ceremony",
      "A first impression designed to feel cinematic, intentional, and emotionally grounded.",
      [item, ...sourceItems.slice(0, 1)].filter(Boolean) as GalleryItem[]
    ),
    buildSection(
      "Reception",
      "Layered tables, focal styling, and room transitions that carry the atmosphere into the celebration.",
      sourceItems.slice(2, 4)
    ),
    buildSection(
      "Details",
      "Smaller design moments that complete the visual story and hold up in every photograph.",
      sourceItems.slice(4, 6)
    ),
  ].filter((section) => section.items.length > 0);

  return {
    item,
    title,
    categoryLabel,
    location: deriveLocation(categoryLabel),
    styleTag: deriveStyleTag(`${item.title} ${categoryLabel}`),
    guestCount: deriveGuestCount(categoryLabel),
    description: `A ${categoryLabel.toLowerCase()} designed with layered focal points, restrained luxury, and a guest experience that feels polished from arrival to final reveal.`,
    sections,
  };
}
