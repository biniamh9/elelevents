import { getPackages } from "@/lib/packages";

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <main className="container section">
      <div className="section-heading package-page-head">
        <p className="eyebrow">Packages</p>
        <h1>Choose the level of styling, then tailor the room after the consultation.</h1>
        <p className="lead">
          These packages are mood-and-service starting points, not rigid public
          prices. The final quote follows the real room, the venue, and the
          details agreed after consultation.
        </p>
      </div>

      <div className="package-editorial-band">
        <div className="card package-editorial-copy">
          <h3>Luxury without confusion</h3>
          <p className="muted">
            The package page should feel curated and aspirational, but still make
            it obvious how to move into a real quote.
          </p>
        </div>
        <div className="card package-editorial-note">
          <strong>Best use:</strong>
          <p className="muted">
            Pick the closest package, then refine guest count, room details, focal
            areas, and any venue restrictions during consultation.
          </p>
        </div>
      </div>

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
