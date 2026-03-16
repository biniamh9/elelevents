import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type TestimonialItem = {
  id: string;
  reviewer_name: string;
  source_label: string | null;
  rating: number | null;
  quote: string;
  highlight: string | null;
  event_type: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const fallbackTestimonials: TestimonialItem[] = [
  {
    id: "testimonial-aster",
    reviewer_name: "Aster Gebremeskel",
    source_label: "Google review",
    rating: 5,
    quote:
      "I had the pleasure of having my wedding beautifully decorated and coordinated by Yordnos and her company, ELEL DESIGN & EVENT. From start to finish, Yordnos was dedicated to bringing our vision to life. Even though we didn’t have a strong idea of what we wanted our wedding to look like, she took the time to understand our style and preferences. Her creativity, attention to detail, and commitment to making our day perfect were truly impressive. Our wedding guests couldn’t stop talking about how beautifully everything was designed. Yordnos also did a wonderful job coordinating our wedding day. She was incredibly precise with the Eritrean customs and traditions that were important to us, while also sticking to hard timelines to keep everything running smoothly. The result was a stunning celebration that exceeded all of our expectations.",
    highlight:
      "Yordnos brought our wedding vision to life with incredible creativity, detail, and care. Our guests could not stop talking about how beautiful everything looked.",
    event_type: "Wedding",
    is_featured: true,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "testimonial-hanna",
    reviewer_name: "Hanna T.",
    source_label: "Google review",
    rating: 5,
    quote:
      "Elel Events and Design truly made my wedding day unforgettable. When I walked into the venue on January 17, 2026, I was overwhelmed with emotion. After spending three stressful months planning the wedding, the moment I saw the decorations, all the stress disappeared. I actually found myself crying - but this time from happiness. Yordi captured my dream perfectly. Every detail of the venue was beautifully designed and thoughtfully arranged. The atmosphere she created was elegant, warm, and exactly what I had imagined for my special day. Her creativity, professionalism, and attention to detail were truly outstanding. She transformed the venue into something magical, and I will forever be grateful for the incredible work she did.",
    highlight:
      "When I walked into the venue, I cried from happiness. Yordi captured my dream perfectly and transformed the space into something elegant, warm, and unforgettable.",
    event_type: "Wedding",
    is_featured: true,
    sort_order: 2,
    is_active: true,
  },
];

export async function getTestimonials(limit?: number) {
  let query = supabaseAdmin
    .from("testimonials")
    .select(
      "id, reviewer_name, source_label, rating, quote, highlight, event_type, is_featured, sort_order, is_active"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return limit ? fallbackTestimonials.slice(0, limit) : fallbackTestimonials;
  }

  return data as TestimonialItem[];
}
