import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type HomeProcessStep = {
  id: string;
  title: string;
  text: string;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export const fallbackHomeProcessSteps: HomeProcessStep[] = [
  {
    id: "home-process-1",
    title: "Submit Request",
    text: "Tell us your date and event details",
    image_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "home-process-2",
    title: "Consultation",
    text: "We align on style, scope, and priorities",
    image_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "home-process-3",
    title: "Quote + Contract",
    text: "You receive pricing and your agreement",
    image_url: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "home-process-4",
    title: "Secure Your Date",
    text: "Sign and pay the deposit to reserve",
    image_url: null,
    sort_order: 4,
    is_active: true,
  },
  {
    id: "home-process-5",
    title: "Event Day",
    text: "Walk into a fully styled celebration",
    image_url: null,
    sort_order: 5,
    is_active: true,
  },
];

export async function getHomeProcessSteps() {
  const { data, error } = await supabaseAdmin
    .from("homepage_process_steps")
    .select("id, title, text, image_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error || !data || data.length === 0) {
    return fallbackHomeProcessSteps;
  }

  return data as HomeProcessStep[];
}
