import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";
import { getTestimonials } from "@/lib/testimonials";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";

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
  "12+ years in event decor and design",
  "Minnesota roots, Atlanta since 2019",
  "5-star Google review reputation",
  "Reception, Melsi, and milestone event experience",
];

const confidenceCards = [
  {
    eyebrow: "Service area",
    title: "Atlanta, GA and surrounding areas",
    text: "Based in Atlanta and serving celebrations across the metro area and nearby communities.",
  },
  {
    eyebrow: "Availability",
    title: "Limited calendar openings",
    text: "Popular wedding weekends, spring dates, and holiday weekends tend to book first.",
  },
  {
    eyebrow: "Pricing guidance",
    title: "Custom quotes, guided clearly",
    text: "Decor investment depends on venue, scope, rentals, floral needs, and event-day labor.",
  },
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const packages = await getPackages(3);
  const testimonials = await getTestimonials(3);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const leadImage = galleryPreview[0]?.image_url;
  const detailImage = galleryPreview[1]?.image_url ?? leadImage;
  const processSteps = [
    {
      title: "Submit Request",
      text: "Share the event details and visual direction.",
      image: galleryPreview[0]?.image_url ?? leadImage,
    },
    {
      title: "Consultation",
      text: "We refine the room, mood, and priorities.",
      image: galleryPreview[1]?.image_url ?? detailImage,
    },
    {
      title: "Quote + Contract",
      text: "Receive clear pricing and the agreement.",
      image: galleryPreview[2]?.image_url ?? leadImage,
    },
    {
      title: "Secure Your Date",
      text: "Sign and pay the deposit to reserve.",
      image: galleryPreview[3]?.image_url ?? detailImage,
    },
    {
      title: "Event Day",
      text: "Walk into a fully styled celebration.",
      image: galleryPreview[4]?.image_url ?? leadImage,
    },
  ];

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
              Luxury event decor for receptions, Melsi, and milestone celebrations,
              designed with care and guided through a clear consultation process.
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
        <div className="simple-proof-band">
          {confidenceCards.map((item) => (
            <Card key={item.title} className="simple-proof-card">
              <p className="eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container section">
        <StorySection
          eyebrow="The experience"
          title="Rooms that feel layered, welcoming, and ready to be remembered."
          description="From head tables and backdrops to guest tables and full-room styling, we create spaces that feel polished when guests arrive and photograph beautifully throughout the event."
          imageUrl={detailImage}
          imageAlt="Head table styling by Elel Events"
          tags={["Head table", "Backdrop", "Lighting"]}
          reverse
        />
      </section>

      <section className="container section">
        <section className="simple-process-shell">
          <div className="simple-process-head">
            <p className="eyebrow">How it works</p>
            <h2>The full process, understood in seconds.</h2>
          </div>
          <div className="simple-process-grid">
            {processSteps.map((item, index) => (
              <Card key={item.title} className="simple-process-card">
                <div className="simple-process-image-wrap">
                  <img src={item.image} alt={item.title} className="simple-process-image" />
                  <span className="simple-process-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.text}</p>
                {index < processSteps.length - 1 ? (
                  <div className="simple-process-connector" aria-hidden="true">
                    <span />
                    <svg viewBox="0 0 20 20">
                      <path
                        d="M4 10h10m0 0-4-4m4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      </section>

      <section className="container section">
        <div className="simple-package-shell">
          <div className="simple-package-head">
            <p className="eyebrow">Packages</p>
            <h2>Choose the package that feels closest to your event, then refine it together.</h2>
          </div>
          <div className="simple-package-grid">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="package-card package-card--simple">
                <p className="eyebrow">Best for</p>
                <h3>{pkg.name}</h3>
                <p className="muted">
                  {pkg.best_for ??
                    pkg.summary ??
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
        <GalleryStrip
          title="Visual moments that help clients imagine their own event."
          items={galleryPreview.slice(0, 4).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
        />
      </section>

      <section className="container section">
        <div className="simple-proof-band">
          <Card className="simple-proof-card">
            <p className="eyebrow">Specialization</p>
            <h3>Weddings, Traditional Melsi, and milestone events</h3>
            <p className="muted">
              We design receptions, Melsi celebrations, bridal showers, birthdays, anniversaries, and elegant gatherings.
            </p>
          </Card>
          <Card className="simple-proof-card">
            <p className="eyebrow">What&apos;s included</p>
            <h3>From focal styling to full-room atmosphere</h3>
            <p className="muted">
              Head tables, backdrops, guest tables, entrance styling, buffet details, setup, and teardown support.
            </p>
          </Card>
          <Card className="simple-proof-card">
            <p className="eyebrow">Vendor support</p>
            <h3>Trusted coordination when you need more than decor</h3>
            <p className="muted">We can recommend vetted partners for photography, catering, venues, planning, sound, and other event support.</p>
            <Button href="/vendors" variant="secondary">
              Explore vendor support
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
        <PageCTA
          eyebrow="Ready to begin"
          title="Tell us about the event and we’ll guide the next step with care."
          description="Share the date, the venue, and the style you love. We will follow up with a consultation and shape the decor direction from there."
        />
      </section>
    </main>
  );
}
