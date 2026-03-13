import { getGalleryItems } from "@/lib/gallery";
import GalleryBrowser from "@/components/gallery/gallery-browser";

export default async function GalleryPage() {
  const images = await getGalleryItems();

  return (
    <main className="container section">
      <h2>Gallery</h2>
      <p className="lead">
        Browse by event category, open images full-screen, and move through the work without leaving the page.
      </p>
      <GalleryBrowser items={images} />
    </main>
  );
}
