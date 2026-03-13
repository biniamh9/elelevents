import { getPackages } from "@/lib/packages";

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <main className="container section">
      <h2>Packages</h2>
      <p className="lead">
        These packages show the level of service we offer, not fixed public prices.
        Final quotes are confirmed after we review your event scope, rentals,
        venue restrictions, and labor requirements.
      </p>
      <div className="package-grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card ${pkg.featured ? "featured" : ""}`}>
            <strong>{pkg.name}</strong>
            <p className="muted" style={{ marginTop: "12px" }}>{pkg.best_for}</p>
            <p>{pkg.summary}</p>
            <ul>
              {(pkg.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
