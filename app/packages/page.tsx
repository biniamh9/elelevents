import { getPackages } from "@/lib/packages";
import { getGalleryItems } from "@/lib/gallery";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

function getPackageTierLabel(index: number) {
  if (index === 0) return "Focused styling";
  if (index === 1) return "Most balanced";
  return "Full-room impact";
}

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
        title="Choose the level that feels closest, then refine it together."
        description="Packages make the first decision easier. During the consultation, we shape the final scope around the venue, the guest count, the focal points, and the details that matter most to your event."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Styled wedding decor by Elel Events"
        reverse
        tags={["Guest tables", "Focal styling", "Venue flow"]}
      />

      <section className="package-compare-shell">
        <div className="section-heading">
          <p className="eyebrow">Compare packages</p>
          <h2>Three clear starting points for different event sizes and styling needs.</h2>
        </div>
        <div className="package-grid package-grid--editorial package-grid--compare">
          {packages.map((pkg, index) => (
            <Card
              key={pkg.id}
              className={`package-card package-card--editorial ${pkg.featured ? "featured" : ""}`}
            >
              <p className="eyebrow">{getPackageTierLabel(index)}</p>
              <strong>{pkg.name}</strong>
              <p className="muted package-compare-best-for">{pkg.best_for ?? pkg.summary}</p>
              <div className="package-compare-meta">
                <p>
                  <span>Best for</span>
                  {pkg.best_for ?? "Custom celebrations"}
                </p>
                <p>
                  <span>Styling level</span>
                  {index === 0 ? "Key focal points" : index === 1 ? "Multiple styled areas" : "Layered full-room design"}
                </p>
                <p>
                  <span>Typical fit</span>
                  {index === 0 ? "Smaller or focused events" : index === 1 ? "Most weddings and milestone events" : "Large or premium celebrations"}
                </p>
              </div>
              <ul>
                {(pkg.features ?? []).slice(0, 5).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button href="/request">Book Consultation</Button>
            </Card>
          ))}
        </div>
      </section>

      <div className="package-grid package-grid--editorial">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card package-card--editorial ${pkg.featured ? "featured" : ""}`}>
            <p className="eyebrow">What this can include</p>
            <strong>{pkg.name}</strong>
            <p className="muted" style={{ marginTop: "12px" }}>{pkg.best_for ?? pkg.summary}</p>
            <p className="muted">{pkg.summary}</p>
            <ul>
              {(pkg.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <Button href="/request">Book Consultation</Button>
          </div>
        ))}
      </div>

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">Pricing guidance</p>
          <h3>Packages guide the direction, not the final quote</h3>
          <p className="muted">
            Final investment depends on the venue, guest count, rentals, labor, floral needs, and the amount of custom styling required.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Availability</p>
          <h3>Popular dates go quickly</h3>
          <p className="muted">
            Spring weekends, summer celebrations, and holiday dates often book first, especially for weddings and Melsi events.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">What&apos;s included</p>
          <h3>Decor scope refined after consultation</h3>
          <p className="muted">
            Packages can include focal tables, backdrops, guest tables, entry styling, room atmosphere, and on-site support.
          </p>
        </Card>
      </section>

      <GalleryStrip
        title="Styled spaces that show how each package direction can come to life."
        items={images.slice(0, 4).map((item) => ({
          id: item.id,
          imageUrl: item.image_url,
          title: item.title,
          label: item.category,
        }))}
      />

      <PageCTA
        title="Choose the closest package, then bring the room to life during consultation."
        description="Packages are only the starting point. The consultation is where the venue, focal styling, guest tables, and room atmosphere come together."
      />
    </main>
  );
}
