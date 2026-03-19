import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import Button from "@/components/ui/button";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";

export const dynamic = "force-dynamic";

const trustCards = [
  "12+ Years Experience",
  "Serving Atlanta Since 2019",
  "Trusted by Satisfied Clients",
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const processSteps = [
    "Submit Request",
    "Consultation",
    "Quote + Contract",
    "Secure Your Date",
    "Event Day",
  ];

  return (
    <main className="home-shell home-shell--simple">
      <div className="home-veil" />

      <section className="hero-stage hero-stage--simple">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="container">
          <div className="home-hero-centered">
            <p className="eyebrow">Elel Events & Design</p>
            <h1>Luxury Event Decor for Weddings &amp; Celebrations</h1>
            <p className="hero-stage-lead">Elegant designs. Seamless execution.</p>
            <div className="btn-row">
              <Button href="/request">Book Consultation</Button>
              <Button href="/gallery" variant="secondary">View Portfolio</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <section className="simple-process-shell">
          <div className="simple-process-head">
            <p className="eyebrow">How it works</p>
            <p className="muted">A simple, guided process from inquiry to execution.</p>
          </div>
          <div className="simple-process-grid">
            {processSteps.map((item, index) => (
              <div key={item} className="simple-process-card">
                <span>{item}</span>
                {index < processSteps.length - 1 ? (
                  <div className="simple-process-connector" aria-hidden="true">
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
          eyebrow="Recent Work"
          title="Designed to be beautiful the moment guests walk in."
          showCaption={false}
          items={galleryPreview.slice(0, 6).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
        />
      </section>

      <section className="container section">
        <section className="home-trust-strip" aria-label="Trust highlights">
          {trustCards.map((item) => (
            <span key={item} className="home-trust-item">
              {item}
            </span>
          ))}
        </section>
      </section>

      <section className="container section">
        <PageCTA
          eyebrow="Ready to begin"
          title="Ready to plan your event?"
          description="Let&apos;s bring your vision to life."
          showSecondary={false}
        />
      </section>
    </main>
  );
}
