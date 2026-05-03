import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";
import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section public-page-shell public-page-shell--gallery">
      <CinematicHomeMotion />
      <section className="gallery-page-band" data-reveal>
        <div className="page-hero-copy gallery-page-head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Portfolio</p>
          <h1>Browse rooms, focal points, and details that can shape your event vision.</h1>
          <p className="lead">
            Browse by event type, open images full-screen, and save the rooms,
            focal points, and styling details that feel closest to your celebration.
          </p>
        </div>
        <Card className="gallery-page-note" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
          <strong>Use this page for inspiration</strong>
          <p className="muted">
            Look for rooms, tables, backdrops, and details that match the mood
            you want, then reference those ideas when you book your consultation.
          </p>
        </Card>
      </section>

      {images.length ? (
        <GalleryBrowser items={images} />
      ) : (
        <section className="card admin-empty-state" data-reveal>
          <strong>No gallery images yet</strong>
          <p className="muted">
            Portfolio images will appear here once gallery items are added and marked visible.
          </p>
        </section>
      )}

      <section data-reveal>
        <PageCTA
          title="Save the visual direction you love, then bring it into your consultation."
          description="Use the portfolio to identify the mood, focal points, and room details that feel right for your celebration."
          showSecondary={false}
        />
      </section>
    </main>
  );
}
