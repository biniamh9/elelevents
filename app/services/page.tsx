import Link from "next/link";
import { getPackages } from "@/lib/packages";

const serviceAreas = [
  {
    title: "Wedding reception styling",
    text: "Head table, backdrop, guest tables, entrance details, buffet styling, and the full room direction.",
  },
  {
    title: "Traditional Melsi design",
    text: "Traditional layouts, next-day styling, and culturally specific details handled with care and clarity.",
  },
  {
    title: "Consultation-led decor planning",
    text: "Clients start with the room they want, then refine scope after a real conversation instead of guessing online.",
  },
];

export default async function ServicesPage() {
  const packages = await getPackages(3);

  return (
    <main className="container section public-page-shell">
      <section className="public-page-banner">
        <div className="section-heading page-hero-copy public-page-head public-page-banner-copy">
          <p className="eyebrow">Services</p>
          <h1>Decor services built around the room, the event flow, and the guest experience.</h1>
          <p className="lead">
            This is a customer-facing overview of what Elel Events handles. Packages are
            starting points, but the real work happens through consultation and thoughtful
            room planning.
          </p>
        </div>
        <div className="public-page-banner-side">
          <div className="card gallery-page-note">
            <strong>What this includes</strong>
            <p className="muted">
              Reception styling, Traditional Melsi design, focal table treatments,
              room atmosphere planning, and consultation-led decor refinement.
            </p>
          </div>
        </div>
      </section>

      <section className="simple-proof-band">
        {serviceAreas.map((item) => (
          <div key={item.title} className="card simple-proof-card">
            <p className="eyebrow">Service area</p>
            <h3>{item.title}</h3>
            <p className="muted">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="simple-package-shell">
        <div className="simple-package-head">
          <p className="eyebrow">Package directions</p>
          <h2>Choose the closest styling direction, then refine it after consultation.</h2>
        </div>
        <div className="simple-package-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card package-card--simple">
              <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
              <h3>{pkg.name}</h3>
              <p className="muted">{pkg.summary}</p>
            </div>
          ))}
        </div>
        <div className="btn-row">
          <Link href="/packages" className="btn secondary">
            View Packages
          </Link>
          <Link href="/request" className="btn">
            Book Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}
