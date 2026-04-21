import EventRequestForm from "@/components/forms/event-request-form";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getGalleryItems } from "@/lib/gallery";
import { getSiteSocialLinks } from "@/lib/social-links";
import Card from "@/components/ui/card";

export default async function RequestPage() {
  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, city, state, service_area, instagram_handle, website_url, bio, pricing_tier")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });
  const images = await getGalleryItems(12);
  const socialLinks = await getSiteSocialLinks();

  return (
    <main className="container section public-page-shell public-page-shell--request">
      <section className="request-page-intro">
        <div className="request-page-intro-copy">
          <p className="eyebrow">Book Consultation</p>
          <h1>Share your event vision in a clear, guided way.</h1>
          <p className="muted">
            Move through the request one step at a time. We keep the process simple,
            spacious, and focused so you can submit with confidence.
          </p>
        </div>
        <Card className="request-page-intro-note">
          <strong>What happens next</strong>
          <p className="muted">
            We review your request, respond within 12 to 24 hours, and move into the consultation that shapes the quote and event direction.
          </p>
        </Card>
      </section>

      <EventRequestForm vendors={vendors ?? []} portfolioItems={images} socialLinks={socialLinks} />
    </main>
  );
}
