import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";
import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section public-page-shell public-page-shell--gallery">
      <CinematicHomeMotion />
      <section data-reveal>
        <ImmersivePageHero
          eyebrow="Portfolio"
          title="Browse rooms, focal points, and details that can shape your event vision."
          description="Browse by event type, open images full-screen, and save the rooms, focal points, and styling details that feel closest to your celebration."
          imageUrl={images[0]?.image_url}
          imageAlt="Portfolio hero image"
          tags={["Head table", "Backdrop", "Reception reveal"]}
          aside={
            <Card className="gallery-page-note" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
              <strong>Use this page for inspiration</strong>
              <p className="muted">
                Look for rooms, tables, backdrops, and details that match the mood
                you want, then reference those ideas when you book your consultation.
              </p>
            </Card>
          }
        />
      </section>
      <section data-reveal>
        <GalleryStrip
          title="A quick look at signature moments."
          items={images.slice(1, 5).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
          showCaption={false}
        />
      </section>
      <GalleryBrowser items={images} />

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
