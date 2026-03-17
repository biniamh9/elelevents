import PageHero from "@/components/site/page-hero";
import { getPackages } from "@/lib/packages";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

const serviceAreas = [
  {
    title: "Wedding receptions",
    text: "Full-room styling with focal tables, guest tables, entrance details, backdrops, and an elegant overall atmosphere.",
  },
  {
    title: "Traditional Melsi celebrations",
    text: "Traditional layouts, next-day styling, and culturally specific decor details handled with care, respect, and experience.",
  },
  {
    title: "Milestone events",
    text: "Bridal showers, birthdays, anniversaries, and other celebrations styled with the same polished design approach.",
  },
  {
    title: "Vendor support when needed",
    text: "If your event needs trusted referrals for venues, catering, photography, planning, or sound, we can help connect you to approved partners.",
  },
];

export default async function ServicesPage() {
  const packages = await getPackages(3);

  return (
    <main className="container section public-page-shell">
      <PageHero
        eyebrow="Services"
        title="Decor services built around the room, the event flow, and the guest experience."
        description="From wedding receptions to Traditional Melsi celebrations and milestone events, Elel Events designs rooms that feel polished, welcoming, and memorable."
        aside={
          <Card className="gallery-page-note">
            <strong>What to expect</strong>
            <p className="muted">
              Every service begins with a consultation so we can understand the
              room, the venue, and the details that matter most to your celebration.
            </p>
          </Card>
        }
      />

      <section className="simple-proof-band">
        {serviceAreas.map((item) => (
          <Card key={item.title} className="simple-proof-card">
            <p className="eyebrow">Service</p>
            <h3>{item.title}</h3>
            <p className="muted">{item.text}</p>
          </Card>
        ))}
      </section>

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>Designed around your event, not a template</h3>
          <p className="muted">
            We help clients choose the right focal points, guest-table styling,
            and room details based on the event flow, venue limitations, and the
            atmosphere they want guests to experience.
          </p>
        </Card>
        <Card>
          <h3>Vendor support, only when it adds value</h3>
          <p className="muted">
            Some clients already have their team in place. Others need help finding
            trusted professionals. When needed, we can recommend approved vendor
            partners to make planning feel easier and more connected.
          </p>
        </Card>
      </section>

      <section className="simple-package-shell">
        <div className="simple-package-head">
          <p className="eyebrow">Package directions</p>
          <h2>Choose the styling level that fits your event best.</h2>
        </div>
        <div className="simple-package-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card package-card--simple">
              <p className="eyebrow">Best for</p>
              <h3>{pkg.name}</h3>
              <p className="muted">{pkg.best_for ?? pkg.summary}</p>
            </div>
          ))}
        </div>
        <div className="btn-row">
          <Button href="/packages" variant="secondary">Explore Packages</Button>
          <Button href="/request">Book Consultation</Button>
        </div>
      </section>
    </main>
  );
}
