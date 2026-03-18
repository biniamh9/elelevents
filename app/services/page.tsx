import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import { getPackages } from "@/lib/packages";
import { getGalleryItems } from "@/lib/gallery";
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
  const images = await getGalleryItems(6);

  return (
    <main className="container section public-page-shell">
      <ImmersivePageHero
        eyebrow="Services"
        title="Decor services designed to transform the full experience of the room."
        description="From wedding receptions to Traditional Melsi celebrations and milestone events, we shape spaces that feel layered, welcoming, and beautifully finished."
        imageUrl={images[0]?.image_url}
        imageAlt="Reception decor by Elel Events"
        tags={["Reception", "Melsi", "Milestone events"]}
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

      <StorySection
        eyebrow="What we design"
        title="From focal tables to the full atmosphere of the room."
        description="Some clients need a few beautifully styled focal points. Others want full-room decor direction. We help shape the level of styling that fits the event, the venue, and the experience you want guests to remember."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Backdrop and table styling by Elel Events"
        reverse
        tags={["Backdrop", "Tablescape", "Lighting"]}
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

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">Service area</p>
          <h3>Atlanta, GA and surrounding areas</h3>
          <p className="muted">
            Based in Atlanta and available for celebrations across the metro area and nearby communities.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">What&apos;s included</p>
          <h3>Decor elements and event-day support</h3>
          <p className="muted">
            Head tables, backdrops, guest tables, entry styling, buffet details, setup, and teardown planning.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Pricing guidance</p>
          <h3>Quotes shaped around the real scope</h3>
          <p className="muted">
            Final pricing depends on venue, guest count, rentals, floral needs, labor, and the scale of the decor.
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

      <GalleryStrip
        title="Visual references from real celebrations."
        items={images.slice(2, 5).map((item) => ({
          id: item.id,
          imageUrl: item.image_url,
          title: item.title,
          label: item.category,
        }))}
      />

      <PageCTA
        title="Choose the service direction that fits your event, then refine it with us."
        description="From reception styling to Traditional Melsi and milestone events, we help shape the room with clarity, beauty, and thoughtful event flow."
      />
    </main>
  );
}
