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

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const processSteps = await getHomeProcessSteps();

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
