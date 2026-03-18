import EventRequestForm from "@/components/forms/event-request-form";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import PageCTA from "@/components/site/page-cta";
import { getGalleryItems } from "@/lib/gallery";
import Card from "@/components/ui/card";

export default async function RequestPage() {
  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, city, state, service_area, instagram_handle, website_url, bio, pricing_tier")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });
  const images = await getGalleryItems(12);

  return (
    <main className="container section public-page-shell public-page-shell--request">
      <ImmersivePageHero
        eyebrow="Book Consultation"
        title="Share the event basics and we’ll guide the design conversation."
        description="Tell us the essentials, choose the decor direction, and upload inspiration if you have it. The form is short, and the final concept is refined during consultation."
        imageUrl={images[0]?.image_url}
        imageAlt="Request page event decor hero"
        tags={["Vision board", "Decor direction", "Consultation"]}
        aside={
          <Card className="booking-intro-notes">
          <div className="booking-note">
            <span>01</span>
            <div>
              <strong>Share the essentials</strong>
              <p className="muted">Event type, date, guest count, and venue direction.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>02</span>
            <div>
              <strong>Choose the decor direction</strong>
              <p className="muted">Full-room styling or the focal points that matter most.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>03</span>
            <div>
              <strong>Move into consultation</strong>
              <p className="muted">We review the request, then refine the concept and quote with you.</p>
            </div>
          </div>
          </Card>
        }
      />

      <EventRequestForm vendors={vendors ?? []} portfolioItems={images} />

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
            We review the request, confirm the consultation, refine the scope with you, and then move into quote and booking steps.
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

      <PageCTA
        eyebrow="Need more inspiration?"
        title="Browse the portfolio, then come back with the rooms and details you love."
        description="The strongest consultations start with a clear feeling. Save the visual cues that match your event and we’ll build from there."
      />
    </main>
  );
}
