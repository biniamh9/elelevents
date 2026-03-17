import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section">
      <div className="section-heading gallery-page-head page-hero-copy">
        <p className="eyebrow">Gallery</p>
        <h1>Browse the work like a saved board of rooms, details, and focal points.</h1>
        <p className="lead">
          Browse by category, open images full-screen, and move through the work
          without leaving the page. This should feel closer to a curated visual
          library than a plain image grid.
        </p>
      </div>
      <div className="gallery-page-band">
        <div className="card gallery-page-note">
          <strong>How to use this page</strong>
          <p className="muted">
            Look for rooms, tables, backdrops, and details that match the mood you
            want, then bring that direction into your quote request.
          </p>
        </div>
      </div>
      <GalleryBrowser items={images} />
    </main>
  );
}
