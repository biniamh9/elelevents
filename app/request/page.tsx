import EventRequestForm from "@/components/forms/event-request-form";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import { getGalleryItems } from "@/lib/gallery";
import Card from "@/components/ui/card";

export default async function RequestPage() {
  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, city, state, service_area, instagram_handle, website_url, bio, pricing_tier")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });
  const images = await getGalleryItems(3);

  return (
    <main className="container section public-page-shell public-page-shell--request">
      <ImmersivePageHero
        eyebrow="Book Consultation"
        title="Tell us about the event and the atmosphere you want to create."
        description="This short form helps us prepare for a thoughtful consultation. Share the basics, the decor direction, and any inspiration images you already have."
        imageUrl={images[0]?.image_url}
        imageAlt="Request page event decor hero"
        tags={["Vision board", "Decor direction", "Consultation"]}
        aside={
          <Card className="booking-intro-notes">
          <div className="booking-note">
            <span>01</span>
            <div>
              <strong>Share the event basics</strong>
              <p className="muted">Date, venue status, guest count, and event type.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>02</span>
            <div>
              <strong>Pick full decor or selected areas</strong>
              <p className="muted">Backdrop, head table, guest tables, entrance, buffet, and more.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>03</span>
            <div>
              <strong>Move into consultation</strong>
              <p className="muted">We review the request first, then quote after the real conversation.</p>
            </div>
          </div>
          </Card>
        }
      />

      <StorySection
        eyebrow="Why this form matters"
        title="A little visual direction up front leads to a better consultation."
        description="When you share the venue status, decor priorities, and inspiration images, we can prepare the right conversation and move into quote planning more smoothly."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Styled room inspiration"
        reverse
        tags={["Venue", "Focal points", "Inspiration"]}
      />

      <EventRequestForm vendors={vendors ?? []} />

      <div style={{ marginTop: "24px" }} className="grid-2 public-note-grid">
        <Card>
          <h3>Custom quote after consultation</h3>
          <p className="muted">
            Your quote is shaped around the venue, scope, rentals, labor, and the
            focal details that matter most to your event.
          </p>
        </Card>

        <Card>
          <h3>What happens after submission?</h3>
          <p className="muted">
            After you submit, we review the request, confirm the consultation,
            refine the scope together, and then move into quote and booking steps.
          </p>
        </Card>
      </div>

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">How it works</p>
          <h3>Inquiry → Consultation → Design → Setup</h3>
          <p className="muted">
            We review your request, confirm the consultation, refine the design direction, then prepare the event for setup day.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Vendor support</p>
          <h3>Optional coordination when you need more than decor</h3>
          <p className="muted">
            If you request vendor help, we can suggest approved partners for planning, photography, catering, venues, and sound.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Availability</p>
          <h3>Book early for popular dates</h3>
          <p className="muted">
            Prime weekends and seasonal celebration dates fill quickly, especially for wedding and Melsi events.
          </p>
        </Card>
      </section>
    </main>
  );
}
