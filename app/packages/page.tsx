import { getPackages } from "@/lib/packages";
import PageHero from "@/components/site/page-hero";
import Card from "@/components/ui/card";

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <main className="container section public-page-shell public-page-shell--packages">
      <PageHero
        eyebrow="Packages"
        title="Choose the level of styling, then tailor the room after the consultation."
        description="These packages are mood-and-service starting points, not rigid public prices. The final quote follows the real room, the venue, and the details agreed after consultation."
        aside={
          <div className="package-editorial-band public-page-band">
            <Card className="package-editorial-copy">
            <h3>Luxury without confusion</h3>
            <p className="muted">
              The package page should feel curated and aspirational, but still make
              it obvious how to move into a real quote.
            </p>
            </Card>
            <Card className="package-editorial-note">
            <strong>Best use:</strong>
            <p className="muted">
              Pick the closest package, then refine guest count, room details, focal
              areas, and any venue restrictions during consultation.
            </p>
            </Card>
          </div>
        }
      />

      <div className="package-grid package-grid--editorial">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card package-card--editorial ${pkg.featured ? "featured" : ""}`}>
            <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
            <strong>{pkg.name}</strong>
            <p className="muted" style={{ marginTop: "12px" }}>{pkg.summary}</p>
            <ul>
              {(pkg.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <span className="package-card-link">Request this direction</span>
          </div>
        ))}
      </div>
    </main>
  );
}
