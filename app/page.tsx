import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";

export const dynamic = "force-dynamic";

const trustCards = [
  "12+ years experience",
  "Serving Atlanta since 2019",
  "Trusted by satisfied clients",
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const leadImage = galleryPreview[0]?.image_url;
  const detailImage = galleryPreview[1]?.image_url ?? leadImage;
  const processSteps = [
    {
      title: "Submit Request",
      text: "Tell us your date and event details.",
    },
    {
      title: "Consultation",
      text: "We align on style, scope, and priorities.",
    },
    {
      title: "Quote + Contract",
      text: "You receive pricing and your agreement.",
    },
    {
      title: "Secure Your Date",
      text: "Sign and pay the deposit to reserve.",
    },
    {
      title: "Event Day",
      text: "Walk into a fully styled celebration.",
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
              Luxury event decor for weddings, Melsi, and milestone celebrations in Atlanta.
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
        <section className="simple-process-shell">
          <div className="simple-process-head">
            <p className="eyebrow">How it works</p>
            <h2>From first inquiry to event day.</h2>
            <p className="muted">A clear five-step booking process, handled with care.</p>
          </div>
          <div className="simple-process-grid">
            {processSteps.map((item, index) => (
              <div key={item.title} className="simple-process-card">
                <div className="simple-process-copy">
                  <span className="simple-process-step-label">
                    Step {index + 1}
                  </span>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.text}</p>
                </div>
                <div className="simple-process-node-wrap" aria-hidden="true">
                  <span className="simple-process-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
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
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="container section">
        <GalleryStrip
          title="A preview of the rooms, tables, and details we create."
          items={galleryPreview.slice(0, 6).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
        />
      </section>

      <section className="container section">
        <div className="simple-proof-band">
          {trustCards.map((item) => (
            <Card key={item} className="simple-proof-card simple-proof-card--compact">
              <h3>{item}</h3>
            </Card>
          ))}
        </div>
      </section>

      <section className="container section">
        <PageCTA
          eyebrow="Ready to begin"
          title="Ready to plan your event?"
          description="Book a consultation and we’ll guide the next step with care."
        />
      </section>
    </main>
  );
}
