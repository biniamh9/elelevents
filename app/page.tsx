import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";
import { getTestimonials } from "@/lib/testimonials";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

export const dynamic = "force-dynamic";

const planningPaths = [
  {
    title: "Wedding reception",
    text: "Head table, backdrop, guest tables, and a full-room atmosphere.",
  },
  {
    title: "Traditional Melsi",
    text: "Traditional setup, next-day styling, and details that need care.",
  },
  {
    title: "Full decoration",
    text: "For clients who want one complete decor direction instead of item-by-item planning.",
  },
  {
    title: "Vendor help too",
    text: "Need catering, photography, venue, sound, or planning referrals as well.",
  },
];

const trustPoints = [
  "5-star Google review reputation",
  "Reception and Melsi experience",
  "Consultation before quote",
  "Quote, contract, and follow-up handled cleanly",
];

const processSteps = [
  {
    title: "Tell us the event",
    text: "Share the date, venue status, guest count, decor direction, and the must-have focal points.",
  },
  {
    title: "Upload the vision",
    text: "Add inspiration images or a vision board so we understand the look without endless back and forth.",
  },
  {
    title: "Refine and secure",
    text: "We consult, quote, send the contract, and confirm the event without making the process feel messy.",
  },
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const packages = await getPackages(3);
  const testimonials = await getTestimonials(3);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const leadImage = galleryPreview[0]?.image_url;
  const detailImage = galleryPreview[1]?.image_url ?? leadImage;

  return (
    <main className="home-shell home-shell--simple">
      <div className="home-veil" />

      <section className="hero-stage hero-stage--simple">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="container hero-stage-grid hero-stage-grid--simple">
          <div className="hero-stage-copy home-hero-copy">
            <p className="eyebrow">Elel Events & Design</p>
            <div className="hero-stage-kicker">
              <span>Luxury decor studio</span>
              <span>Reception, wedding, and Melsi</span>
            </div>
            <h1>
              Simple to book.
              <br />
              <em>Beautiful to walk into.</em>
            </h1>
            <p className="hero-stage-lead">
              Luxury decor for receptions, Melsi, and milestone events with a
              cleaner process from inquiry to quote to contract.
            </p>

            <div className="btn-row">
              <Button href="/request">Book Consultation</Button>
              <Button href="/gallery" variant="secondary">View Portfolio</Button>
            </div>
          </div>

          <div className="hero-stage-visual hero-stage-visual--simple home-hero-visual">
            <div className="hero-stage-showcase home-hero-showcase">
              <div className="hero-stage-card hero-stage-card--tall hero-stage-card--lead">
                <img src={leadImage} alt="Luxury event setup by Elel Events" />
                <div className="hero-stage-card-caption">
                  <span>Reception reveal</span>
                  <strong>Elegant rooms with focal detail and a clean finish.</strong>
                </div>
              </div>

              <div className="hero-stage-side-stack">
                <div className="hero-stage-card hero-stage-card--detail hero-stage-card--accent">
                  <img src={detailImage} alt="Styled head table by Elel Events" />
                </div>

                <Card className="hero-stage-mood-note home-hero-note">
                  <p className="eyebrow">Visual direction</p>
                  <h3>Layered styling, warm lighting, and focal points that photograph well.</h3>
                  <div className="hero-stage-mood-tags">
                    <span>Head table</span>
                    <span>Backdrop</span>
                    <span>Melsi</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <Card className="hero-quick-search">
          <p className="eyebrow">What are you planning?</p>
          <div className="hero-quick-grid">
            {planningPaths.map((item) => (
              <Button key={item.title} href="/request" variant="secondary" className="hero-quick-card">
                <span className="hero-quick-card-content">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <section className="container section">
        <div className="luxury-marquee" aria-label="Trust highlights">
          {trustPoints.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="container section">
        <section className="simple-process-shell">
          <div className="simple-process-head">
            <p className="eyebrow">How it works</p>
            <h2>Fast enough to choose. Clear enough to trust.</h2>
          </div>
          <div className="simple-process-grid">
            {processSteps.map((item, index) => (
              <Card key={item.title} className="simple-process-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p className="muted">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>
      </section>

      <section className="container section">
        <div className="simple-package-shell">
          <div className="simple-package-head">
            <p className="eyebrow">Packages</p>
            <h2>Start with a direction, then tailor the room from there.</h2>
          </div>
          <div className="simple-package-grid">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="package-card package-card--simple">
                <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
                <h3>{pkg.name}</h3>
                <p className="muted">
                  {pkg.summary ??
                    pkg.best_for ??
                    "Custom decor support tailored to your event."}
                </p>
                <Button href="/packages" variant="secondary" className="package-card-link">
                  See package details
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="simple-proof-band">
          <Card className="simple-proof-card">
            <p className="eyebrow">Gallery</p>
            <h3>See the room before you book it.</h3>
            <Button href="/gallery" variant="secondary">
              Browse the work
            </Button>
          </Card>

          <Card className="simple-proof-card">
            <p className="eyebrow">Vendor support</p>
            <h3>Need vendor help beyond decor?</h3>
            <Button href="/vendors" variant="secondary">
              Explore vendor partners
            </Button>
          </Card>

          <Card className="simple-proof-card">
            <p className="eyebrow">Start here</p>
            <h3>Upload the vision and we’ll shape the right next step.</h3>
            <Button href="/request" variant="secondary">
              Request your quote
            </Button>
          </Card>
        </div>
      </section>

      <section className="container section">
        <section className="simple-testimonial-shell">
          <div className="simple-testimonial-head">
            <div>
              <p className="eyebrow">Client trust</p>
              <h2>5-star feedback from real celebrations</h2>
            </div>
            <a
              href="https://www.google.com/search?q=Elel+Events+and+Design+reviews"
              target="_blank"
              rel="noreferrer"
              className="link-inline"
            >
              View Google reviews
            </a>
          </div>

          <div className="simple-testimonial-grid">
            {testimonials.map((item) => (
              <Card key={item.id} as="article" className="testimonial-card">
                <div className="testimonial-card-top">
                  <span className="testimonial-stars">
                    {"★".repeat(item.rating ?? 5)}
                  </span>
                  <span className="testimonial-source">
                    {item.source_label || "Google review"}
                  </span>
                </div>
                <p className="testimonial-quote">“{item.highlight || item.quote}”</p>
                <div className="testimonial-meta">
                  <strong>{item.reviewer_name}</strong>
                  <small>{item.event_type || "Event client"}</small>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </section>

      <section className="container section">
        <section className="cta-shell cta-shell--editorial">
          <div>
            <span className="eyebrow">Ready to begin</span>
            <h2>Tell us the event and we’ll take it from there.</h2>
            <p className="lead">
              The homepage should not make people work hard. The real detail belongs
              inside the request form, not in a crowded landing page.
            </p>
          </div>

          <div className="btn-row">
            <Button href="/request">Request a Quote</Button>
            <Button href="/gallery" variant="secondary">View Gallery</Button>
          </div>
        </section>
      </section>

      <div className="footer container">
        © 2026 Elel Events. Elegant design for meaningful celebrations.
      </div>
    </main>
  );
}
