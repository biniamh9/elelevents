import { getPackages } from "@/lib/packages";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <main className="container section public-page-shell public-page-shell--packages">
      <PageHero
        eyebrow="Packages"
        title="Choose the level of styling, then tailor the room after the consultation."
        description="Each package is a starting point designed to help you choose the right level of styling. During the consultation, we refine the scope around your venue, guest count, and event priorities."
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
