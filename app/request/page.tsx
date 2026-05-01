import EventRequestForm from "@/components/forms/event-request-form";
import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";

export default function RequestPage() {
  return (
    <main className="container section public-page-shell public-page-shell--request">
      <CinematicHomeMotion />
      <ImmersivePageHero
        eyebrow="Check Availability"
        title="Start with the essentials and we’ll take it from there."
        description="Share your event type, guest count, services needed, budget range, consultation preference, and contact details. The more detailed inspiration can come after submission."
        imageUrl="/hero1.jpeg"
        imageAlt="Luxury ballroom event styling"
        tags={["Fast inquiry", "Minimal intake", "Luxury event design"]}
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>Tell us the basics</strong>
                <p className="muted">Event type, guest count, event date, services needed, and the best way to reach you.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Add inspiration after submission</strong>
                <p className="muted">Pinterest boards, Instagram links, and images can come in the next step.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>Expect a fast response</strong>
                <p className="muted">We review new requests and reply within 12–24 hours.</p>
              </div>
            </div>
          </Card>
        }
      />

      <EventRequestForm />

      <section className="request-reassurance-grid" data-reveal>
        <Card data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Simple by design</p>
          <h3>No long questionnaire</h3>
          <p className="muted">
            We keep the first step short so you can submit quickly and continue refining the
            vision once availability is confirmed.
          </p>
        </Card>
        <Card data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
          <p className="eyebrow">What happens next</p>
          <h3>Inspiration comes after the first submit</h3>
          <p className="muted">
            Once your request is in, you can upload photos and share links that help us
            understand your style more clearly.
          </p>
        </Card>
        <Card data-reveal-child style={{ ["--reveal-delay" as string]: "240ms" }}>
          <p className="eyebrow">Response timing</p>
          <h3>Reviewed within 12–24 hours</h3>
          <p className="muted">
            We respond quickly with next steps, consultation direction, and availability context.
          </p>
        </Card>
      </section>

      <PageCTA
        eyebrow="Prefer to browse first?"
        title="Explore the portfolio, then return when you’re ready to check your date."
        description="A clear visual reference helps us move faster, but it should never be a requirement before you contact us."
      />
    </main>
  );
}
