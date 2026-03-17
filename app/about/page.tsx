import Link from "next/link";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="container section public-page-shell">
      <PageHero
        eyebrow="About Elel Events"
        title="At Elel Events & Design, we believe every event should feel effortless, intentional, and unforgettable."
        description="With over 12 years of experience in event decor and design, our journey began in Minnesota, where we built a strong foundation rooted in creativity, precision, and client satisfaction. Since relocating to Atlanta in 2019, we have continued to elevate celebrations across the city, bringing refined design and seamless execution to every event we touch."
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
              <strong>Story-led event atmospheres</strong>
              <p className="muted">From elegant wedding receptions to traditional Melsi celebrations and milestone events, every detail is thoughtfully curated to reflect each client&apos;s vision.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
              <strong>Reputation built on trust</strong>
              <p className="muted">Clients consistently highlight our professionalism, reliability, and attention to detail, and we are proud to say our work speaks for itself.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
              <strong>Consistency without compromise</strong>
              <p className="muted">We have built our reputation on trust, consistency, and delivering exactly what we promise, with zero complaints and countless satisfied clients.</p>
              </div>
            </div>
          </Card>
        }
      />

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>What sets us apart</h3>
          <p className="muted">
            At Elel Events &amp; Design, we don&apos;t just design events. We create
            experiences people remember. Every celebration is approached with
            intentional styling, calm execution, and a standard of excellence that
            clients can feel from the first consultation to the final reveal.
          </p>
        </Card>

        <Card>
          <h3>How to begin</h3>
          <p className="muted">
            Start with the inquiry form, share your vision, and move into consultation.
            From there, we refine the decor direction, confirm the scope, and guide
            you cleanly into quote, contract, and event-day execution.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Button href="/request">Book Consultation</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
