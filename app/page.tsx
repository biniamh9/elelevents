import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import HomeProcessFlow from "@/components/home/home-process-flow";
import { getGalleryItems } from "@/lib/gallery";
import { getHomeProcessSteps } from "@/lib/home-process";
import Button from "@/components/ui/button";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";

export const dynamic = "force-dynamic";

const trustCards = [
  "12+ Years Experience",
  "Serving Atlanta Since 2019",
  "Trusted by Satisfied Clients",
];

function pickHeroImage(
  items: Awaited<ReturnType<typeof getGalleryItems>>,
  needles: string[],
  fallbackIndex = 0
) {
  const match = items.find((item) => {
    const haystack = `${item.title} ${item.category ?? ""}`.toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
  });

  return match ?? items[fallbackIndex] ?? items[0];
}

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(12);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const processSteps = await getHomeProcessSteps();
  const sweetheartImage = pickHeroImage(galleryPreview, ["head table", "sweetheart", "wedding"], 0);
  const drapeImage = pickHeroImage(galleryPreview, ["ceiling", "drape", "reception"], 1);
  const floralImage = pickHeroImage(galleryPreview, ["floral", "arrangement", "centerpiece"], 2);
  const reactionImage = pickHeroImage(galleryPreview, ["wedding", "reception", "luxury"], 3);

  return (
    <main className="home-shell home-shell--simple">
      <div className="home-veil" />

      <section className="hero-stage hero-stage--simple">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="container">
          <div className="home-hero-signature">
            <div className="home-hero-copy-panel">
              <h1>Where Your Dream Event Becomes a Breathtaking Reality</h1>
              <p className="hero-stage-lead">
                From intimate gatherings to grand celebrations, we craft unforgettable experiences with meticulous attention to every detail.
              </p>
              <div className="btn-row home-hero-actions">
                <Button href="/request" className="home-hero-primary-cta">Start Consultation</Button>
                <Button href="/gallery" variant="secondary" className="home-hero-secondary-cta">View Portfolio</Button>
              </div>
            </div>

            <div className="home-hero-floating-showcase" aria-hidden="true">
              <article className="home-hero-floating-card home-hero-floating-card--sweetheart">
                <img src={sweetheartImage?.image_url} alt="" />
                <div className="home-hero-floating-card-copy">
                  <span>Wedding</span>
                  <strong>Elegant Garden Wedding</strong>
                </div>
              </article>
              <article className="home-hero-floating-card home-hero-floating-card--drape">
                <img src={drapeImage?.image_url} alt="" />
                <div className="home-hero-floating-card-copy">
                  <span>Reception</span>
                  <strong>Luxury Reception Hall</strong>
                </div>
              </article>
              <article className="home-hero-floating-card home-hero-floating-card--floral">
                <img src={floralImage?.image_url} alt="" />
                <div className="home-hero-floating-card-copy">
                  <span>Corporate</span>
                  <strong>Modern Corporate Gala</strong>
                </div>
              </article>
              <article className="home-hero-floating-card home-hero-floating-card--reaction">
                <img src={reactionImage?.image_url} alt="" />
                <div className="home-hero-floating-card-copy">
                  <span>Cultural</span>
                  <strong>Traditional Celebration</strong>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="container section">
        <HomeProcessFlow
          steps={processSteps.map((item, index) => ({
            title: item.title,
            text: item.text,
            imageUrl:
              item.image_url ??
              galleryPreview[index]?.image_url ??
              galleryPreview[0]?.image_url,
          }))}
        />
      </section>

      <section className="container section">
        <GalleryStrip
          eyebrow="Portfolio"
          title="Designed to be beautiful the moment guests walk in."
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
