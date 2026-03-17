import Link from "next/link";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="container section public-page-shell">
      <PageHero
        eyebrow="About Elel Events"
        title="Designing rooms that feel warm, elevated, and memorable."
        description="Elel Events & Design creates wedding and celebration spaces that feel polished without losing warmth. The process is consultation-led, visually driven, and built around the atmosphere each client wants guests to walk into."
        aside={
          <Card className="booking-intro-notes">
          <div className="booking-note">
            <span>01</span>
            <div>
              <strong>Reception and Melsi experience</strong>
              <p className="muted">Traditional events and modern celebrations handled with the same care.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>02</span>
            <div>
              <strong>Design-first approach</strong>
              <p className="muted">Mood, focal points, and room flow come before generic package thinking.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>03</span>
            <div>
              <strong>Clear client process</strong>
              <p className="muted">Inquiry, consultation, quote, contract, and follow-up handled in one clean flow.</p>
            </div>
          </div>
          </Card>
        }
      />

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>What clients can expect</h3>
          <p className="muted">
            A refined process, collaborative consultation, and styling that feels
            intentional from the entrance to the head table to the final room reveal.
          </p>
        </Card>

        <Card>
          <h3>How to begin</h3>
          <p className="muted">
            Start with the inquiry form, upload the vision if you have one, then
            move into consultation before the quote and contract stage.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Button href="/request">Book Consultation</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
