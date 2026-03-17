import EventRequestForm from "@/components/forms/event-request-form";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";

export default async function RequestPage() {
  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, city, state, service_area, instagram_handle, website_url, bio, pricing_tier")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });

  return (
    <main className="container section public-page-shell public-page-shell--request">
      <PageHero
        eyebrow="Request a Quote"
        title="Start with the room you want, not just the event date."
        description="This is where the booking system meets the brand. It should still feel refined and visual, but it also needs to gather the details that make the consultation and quote process stronger."
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

      <EventRequestForm vendors={vendors ?? []} />

      <div style={{ marginTop: "24px" }} className="grid-2 public-note-grid">
        <Card>
          <h3>No fake instant pricing</h3>
          <p className="muted">
            Quotes happen after the consultation. The website should feel more
            like a luxury booking experience than a cheap calculator for a
            custom decor service.
          </p>
        </Card>

        <Card>
          <h3>What happens after submission?</h3>
          <p className="muted">
            After you submit, we review the request internally, reach out for a
            consultation if needed, confirm scope, and then move to quote,
            contract, and booking steps.
          </p>
        </Card>
      </div>
    </main>
  );
}
