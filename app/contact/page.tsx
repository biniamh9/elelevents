import Link from "next/link";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="container section public-page-shell">
      <PageHero
        eyebrow="Contact"
        title="Start the conversation, then we’ll guide the next step clearly."
        description="The fastest way to reach Elel Events is through the inquiry and consultation flow. That keeps the event details, vision, and follow-up in one place."
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>Best first step</strong>
                <p className="muted">Use the inquiry form to share your event date, venue status, and decor direction.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Consultation before quote</strong>
                <p className="muted">Quotes are shaped after the real conversation, not from a generic instant calculator.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>Visual references welcome</strong>
                <p className="muted">You can share inspiration images and mood direction during the booking flow.</p>
              </div>
            </div>
          </Card>
        }
      />

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>For design inquiries</h3>
          <p className="muted">
            Reception styling, Melsi setup, full decoration, and room transformation
            requests should all start through the consultation form.
          </p>
        </Card>

        <Card>
          <h3>Need to see the work first?</h3>
          <p className="muted">
            Browse the portfolio to save the rooms, tables, and focal details that
            feel closest to your event vision.
          </p>
          <div className="btn-row">
            <Button href="/request">Book Consultation</Button>
            <Button href="/gallery" variant="secondary">View Portfolio</Button>
          </div>
          <div style={{ marginTop: "8px" }}>
            <Link href="/gallery" className="link-inline">
              Open portfolio
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
