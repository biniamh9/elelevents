import PageHero from "@/components/site/page-hero";
import { getPackages } from "@/lib/packages";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

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
      <PageHero
        eyebrow="Services"
        title="Decor services built around the room, the event flow, and the guest experience."
        description="This is a customer-facing overview of what Elel Events handles. Packages are starting points, but the real work happens through consultation and thoughtful room planning."
        aside={
          <Card className="gallery-page-note">
            <strong>What this includes</strong>
            <p className="muted">
              Reception styling, Traditional Melsi design, focal table treatments,
              room atmosphere planning, and consultation-led decor refinement.
            </p>
          </Card>
        }
      />

      <section className="simple-proof-band">
        {serviceAreas.map((item) => (
          <Card key={item.title} className="simple-proof-card">
            <p className="eyebrow">Service area</p>
            <h3>{item.title}</h3>
            <p className="muted">{item.text}</p>
          </Card>
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
          <Button href="/packages" variant="secondary">View Packages</Button>
          <Button href="/request">Book Consultation</Button>
        </div>
      </section>
    </main>
  );
}
