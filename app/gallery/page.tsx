import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section public-page-shell public-page-shell--gallery">
      <PageHero
        eyebrow="Portfolio"
        title="Browse the work like a saved board of rooms, details, and focal points."
        description="Browse by category, open images full-screen, and move through the work without leaving the page. This should feel closer to a curated visual library than a plain image grid."
        aside={
          <Card className="gallery-page-note">
            <strong>How to use this page</strong>
            <p className="muted">
              Look for rooms, tables, backdrops, and details that match the mood you
              want, then bring that direction into your quote request.
            </p>
          </Card>
        }
      />
      <GalleryBrowser items={images} />
    </main>
  );
}
