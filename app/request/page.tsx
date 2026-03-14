import EventRequestForm from "@/components/forms/event-request-form";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export default async function RequestPage() {
  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, city, state, service_area, instagram_handle, website_url, bio, pricing_tier")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });

  return (
    <main className="container section">
      <section className="booking-intro">
        <div className="booking-intro-copy page-hero-copy">
          <p className="eyebrow">Request a Quote</p>
          <h1>Start with the room you want, not just the event date.</h1>
          <p className="lead">
            This is where the booking system meets the brand. It should still
            feel refined and visual, but it also needs to gather the details
            that make the consultation and quote process stronger.
          </p>
        </div>

        <div className="booking-intro-notes card">
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
        </div>
      </section>

      <EventRequestForm vendors={vendors ?? []} />

      <div style={{ marginTop: "24px" }} className="grid-2">
        <div className="card">
          <h3>No fake instant pricing</h3>
          <p className="muted">
            Quotes happen after the consultation. The website should feel more
            like a luxury booking experience than a cheap calculator for a
            custom decor service.
          </p>
        </div>

        <div className="card">
          <h3>What happens after submission?</h3>
          <p className="muted">
            After you submit, we review the request internally, reach out for a
            consultation if needed, confirm scope, and then move to quote,
            contract, and booking steps.
          </p>
        </div>
      </div>
    </main>
  );
}
