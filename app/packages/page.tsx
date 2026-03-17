import { getPackages } from "@/lib/packages";
import { getGalleryItems } from "@/lib/gallery";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default async function PackagesPage() {
  const packages = await getPackages();
  const images = await getGalleryItems(4);

  return (
    <main className="container section public-page-shell public-page-shell--packages">
      <ImmersivePageHero
        eyebrow="Packages"
        title="Choose the styling level, then shape the room with us."
        description="Each package is a starting point designed to help you choose the right level of styling. During the consultation, we refine the scope around your venue, guest count, and event priorities."
        imageUrl={images[0]?.image_url}
        imageAlt="Luxury decor package inspiration"
        tags={["Essential", "Signature", "Luxury"]}
        aside={
          <div className="package-editorial-band public-page-band">
            <Card className="package-editorial-copy">
            <h3>How to choose</h3>
            <p className="muted">
              Start with the package that feels closest to your event, then use
              the consultation to refine focal points, rentals, and room details.
            </p>
            </Card>
            <Card className="package-editorial-note">
            <strong>Next step:</strong>
            <p className="muted">
              Once you know which direction feels right, book a consultation and
              we will shape the details around your event.
            </p>
            </Card>
          </div>
        }
      />

      <StorySection
        eyebrow="How to choose"
        title="Start with the package that feels closest to your event."
        description="Packages help you choose the right level of styling without locking you into a rigid template. During the consultation, we refine focal points, rentals, guest tables, and venue considerations together."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Styled wedding decor by Elel Events"
        reverse
        tags={["Guest tables", "Focal styling", "Venue flow"]}
      />

      <div className="package-grid package-grid--editorial">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card package-card--editorial ${pkg.featured ? "featured" : ""}`}>
            <p className="eyebrow">Best for</p>
            <strong>{pkg.name}</strong>
            <p className="muted" style={{ marginTop: "12px" }}>{pkg.best_for ?? pkg.summary}</p>
            <p className="muted">{pkg.summary}</p>
            <ul>
              {(pkg.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <div className="btn-row">
              <Button href="/request">Book Consultation</Button>
              <Button href="/services" variant="secondary">Explore Services</Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
