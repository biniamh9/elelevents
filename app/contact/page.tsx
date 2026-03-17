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
        description="If you are planning a wedding reception, Traditional Melsi celebration, or milestone event, we would love to hear from you. The best first step is to book a consultation so we can understand your event clearly."
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>Email</strong>
                <p className="muted">yordecor@gmail.com</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Phone</strong>
                <p className="muted">612-964-3553</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>Service area</strong>
                <p className="muted">Based in Atlanta and serving celebrations across the metro area.</p>
              </div>
            </div>
          </Card>
        }
      />

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>What happens after you reach out?</h3>
          <p className="muted">
            We review the event details, follow up to confirm the consultation, and
            guide you through design direction, scope, and quote preparation. Most
            responses go out within 1 to 2 business days.
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
