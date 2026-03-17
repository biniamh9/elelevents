import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import GalleryStrip from "@/components/site/gallery-strip";
import Card from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section public-page-shell public-page-shell--gallery">
      <ImmersivePageHero
        eyebrow="Portfolio"
        title="Browse rooms, focal points, and details that can shape your event vision."
        description="Browse by event type, open images full-screen, and save the rooms, focal points, and styling details that feel closest to your celebration."
        imageUrl={images[0]?.image_url}
        imageAlt="Portfolio hero image"
        tags={["Head table", "Backdrop", "Reception reveal"]}
        aside={
          <Card className="gallery-page-note">
            <strong>Use this page for inspiration</strong>
            <p className="muted">
              Look for rooms, tables, backdrops, and details that match the mood
              you want, then reference those ideas when you book your consultation.
            </p>
          </Card>
        }
      />
      <GalleryStrip
        title="A quick look at signature moments."
        items={images.slice(1, 5).map((item) => ({
          id: item.id,
          imageUrl: item.image_url,
          title: item.title,
          label: item.category,
        }))}
      />
      <GalleryBrowser items={images} />
    </main>
  );
}
