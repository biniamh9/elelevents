import HomeProcessFlow from "@/components/home/home-process-flow";
import { getGalleryItems } from "@/lib/gallery";
import { getHomeProcessSteps } from "@/lib/home-process";
import Button from "@/components/ui/button";
import GalleryStrip from "@/components/site/gallery-strip";

export const dynamic = "force-dynamic";

const trustStats = [
  { value: "500+", label: "Events Planned" },
  { value: "4.9", label: "Average Rating" },
  { value: "100%", label: "Satisfaction Rate" },
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
  const processSteps = await getHomeProcessSteps();
  const heroImage = pickHeroImage(galleryPreview, ["garden", "centerpiece", "head table", "wedding"], 0);

  return (
    <main className="home-shell home-shell--simple">
      <div className="home-veil" />

      <section className="hero-stage hero-stage--timeless">
        <div className="luxury-hero-media">
          <img src={heroImage?.image_url} alt="Luxury event decor table styling by Elel Events" />
          <div className="luxury-hero-overlay" />
        </div>

        <div className="luxury-hero-content container">
          <span className="luxury-hero-badge">Atlanta&apos;s premier event design</span>
          <h1>
            Timeless Elegance,
            <br />
            <em>Unforgettable Moments</em>
          </h1>
          <p>
            Curating extraordinary celebrations with meticulous attention to every exquisite detail.
          </p>
          <div className="luxury-hero-actions">
            <Button href="/request" className="luxury-hero-primary">Begin Your Journey</Button>
            <Button href="/gallery" variant="secondary" className="luxury-hero-secondary">Explore Our Work</Button>
          </div>
          <span className="luxury-hero-scroll">Scroll</span>
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

      <section className="home-proof-band" aria-labelledby="home-proof-title">
        <div className="container">
          <div className="home-proof-shell">
            <h2 id="home-proof-title">Trusted by hundreds of happy couples and event hosts</h2>
            <div className="home-proof-stats" aria-label="Trust statistics">
              {trustStats.map((item) => (
                <div key={item.label} className="home-proof-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta-band">
        <div className="container">
          <div className="home-cta-band-shell">
            <h2>Ready to start planning?</h2>
            <p>Let&apos;s create something unforgettable together. Our team is ready to bring your vision to life.</p>
            <Button href="/request" className="home-cta-band-button">Begin Your Journey</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
