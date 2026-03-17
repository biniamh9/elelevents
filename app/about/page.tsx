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
          <h3>Why clients trust Elel Events</h3>
          <p className="muted">
            At Elel Events &amp; Design, we don&apos;t just design events. We create
            experiences people remember. Every celebration is approached with
            intentional styling, calm execution, and a standard of excellence that
            clients can feel from the first consultation to the final reveal.
          </p>
        </Card>

        <Card>
          <h3>Founder-led design with follow-through</h3>
          <p className="muted">
            Led by Yordi, the studio is known for warm communication, thoughtful
            design decisions, and a dependable process that keeps clients informed
            from consultation through event day.
          </p>
        </Card>
      </section>

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">Origin story</p>
          <h3>Minnesota foundation</h3>
          <p className="muted">
            Our early work in Minnesota established the creative discipline,
            professionalism, and client care that still define the brand today.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Atlanta presence</p>
          <h3>Serving Atlanta since 2019</h3>
          <p className="muted">
            Since relocating to Atlanta, we have continued designing wedding
            receptions, Traditional Melsi celebrations, and milestone events with
            a refined, client-centered approach.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Reputation</p>
          <h3>Professional, reliable, detail-driven</h3>
          <p className="muted">
            Clients consistently highlight our professionalism, reliability, and
            attention to detail, and our five-star feedback reflects that trust.
          </p>
        </Card>
      </section>

      <section className="cta-shell cta-shell--editorial">
        <div>
          <span className="eyebrow">Work with us</span>
          <h2>Bring your event vision into a consultation that feels calm and clear.</h2>
          <p className="lead">
            Share the event details, the atmosphere you want to create, and the
            focal points that matter most. We will guide the rest.
          </p>
        </div>
        <div className="btn-row">
          <Button href="/request">Book Consultation</Button>
          <Button href="/gallery" variant="secondary">View Portfolio</Button>
        </div>
      </section>
    </main>
  );
}
