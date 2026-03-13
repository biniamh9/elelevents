import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type PackageItem = {
  id: string;
  name: string;
  best_for: string | null;
  summary: string | null;
  features: string[] | null;
  featured: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const fallbackPackages: PackageItem[] = [
  {
    id: "pkg-1",
    name: "Essential Package",
    best_for: "Smaller events that need polished styling without a full-room takeover.",
    summary:
      "A focused decor package for clients who want a clean, elegant look around a few key moments of the event.",
    features: [
      "Planning consultation",
      "Backdrop or focal styling",
      "Cake table or welcome area styling",
      "Basic tablescape support",
      "Setup and breakdown coordination",
    ],
    featured: false,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "pkg-2",
    name: "Signature Package",
    best_for: "Weddings, showers, birthdays, and celebrations with multiple styled areas.",
    summary:
      "A more complete event design package with stronger visual cohesion across the room.",
    features: [
      "Theme and design planning",
      "Head table or sweetheart table styling",
      "Centerpieces and guest table styling",
      "Welcome sign and entry decor",
      "Cake or buffet styling",
      "On-site setup support",
    ],
    featured: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "pkg-3",
    name: "Luxury Package",
    best_for: "Large or premium events that need full-scale decor planning and layered styling.",
    summary:
      "Our highest-touch package for events that need a bigger visual impact and more custom coordination.",
    features: [
      "Full event design direction",
      "Ceremony and reception styling",
      "Premium focal installations",
      "Guest table and room styling",
      "Optional ceiling draping depending on venue rules and feasibility",
      "Extended on-site styling support",
    ],
    featured: false,
    sort_order: 3,
    is_active: true,
  },
];

export async function getPackages(limit?: number) {
  let query = supabaseAdmin
    .from("packages")
    .select("id, name, best_for, summary, features, featured, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return limit ? fallbackPackages.slice(0, limit) : fallbackPackages;
  }

  return data as PackageItem[];
}
