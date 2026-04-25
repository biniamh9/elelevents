import Link from "next/link";

import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import { getPackages } from "@/lib/packages";
import { getGalleryItems } from "@/lib/gallery";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { getSeoLandingPageEntries } from "@/lib/seo-landing-pages";

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

const inclusionHighlights = [
  {
    eyebrow: "What we style",
    title: "Focal tables and guest-facing moments",
    text: "Head tables, sweetheart tables, backdrops, entry styling, cake or buffet areas, and other visual anchors that define the room.",
  },
  {
    eyebrow: "How it feels",
    title: "A room that feels cohesive from arrival to photos",
    text: "We shape the atmosphere so the room feels polished in person, balanced in photos, and welcoming for guests throughout the event.",
  },
  {
    eyebrow: "When vendor support helps",
    title: "Coordination beyond decor, only when needed",
    text: "If you still need a venue, planner, photographer, caterer, or sound team, we can point you toward approved partners that fit the event.",
  },
];

const rentalHighlights = [
  {
    title: "Chair and seating rentals",
    text: "Quote-ready rental inventory for celebrations that need elegant seating, practical quantity tracking, and clear logistics.",
  },
  {
    title: "Focal decor rentals",
    text: "Backdrop pieces, candles, and decor assets that can support a rentals-only inquiry or be folded into a broader design scope.",
  },
  {
    title: "Delivery and setup support",
    text: "Qualifying rental items can include delivery, setup, breakdown, and refundable security deposit terms within the quote flow.",
  },
];

export default async function ServicesPage() {
  const packages = await getPackages(3);
  const images = await getGalleryItems(6);
  const seoPages = getSeoLandingPageEntries();

  return (
    <main className="container section public-page-shell">
      <CinematicHomeMotion />
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
        title="From focal pieces to the full feeling of the room."
        description="Some events need a few beautifully styled anchors. Others need complete room direction. We help define the right level of decor so the event feels intentional, welcoming, and memorable."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Backdrop and table styling by Elel Events"
        reverse
        tags={["Backdrop", "Tablescape", "Lighting"]}
      />

      <section className="public-callout-grid" data-reveal>
        {serviceAreas.map((item, index) => (
          <Card
            key={item.title}
            className="public-callout-card"
            data-reveal-child
            style={{ ["--reveal-delay" as string]: `${80 + index * 80}ms` }}
          >
            <p className="eyebrow">Service</p>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </Card>
        ))}
      </section>

      <section className="public-callout-grid" data-reveal>
        {inclusionHighlights.map((item, index) => (
          <Card
            key={item.title}
            className="public-callout-card"
            data-reveal-child
            style={{ ["--reveal-delay" as string]: `${80 + index * 80}ms` }}
          >
            <p className="eyebrow">{item.eyebrow}</p>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </Card>
        ))}
      </section>

      <section className="simple-package-shell" data-reveal>
        <div className="simple-package-head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Rentals</p>
          <h2>Browse rental inventory for seating, focal pieces, and event-ready decor assets.</h2>
          <p className="muted">
            If you need rentals without full event design, or you want to combine both in one inquiry,
            the rentals page gives a cleaner starting point.
          </p>
        </div>
        <div className="public-callout-grid">
          {rentalHighlights.map((item, index) => (
            <Card
              key={item.title}
              className="public-callout-card"
              data-reveal-child
              style={{ ["--reveal-delay" as string]: `${120 + index * 80}ms` }}
            >
              <p className="eyebrow">Rental support</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Card>
          ))}
        </div>
        <div className="btn-row" data-reveal-child style={{ ["--reveal-delay" as string]: "360ms" }}>
          <Button href="/rentals">Browse Rentals</Button>
          <Button href="/rentals/request" variant="secondary">Request Rental Quote</Button>
        </div>
      </section>

      <section className="seo-service-links-shell" data-reveal>
        <div className="section-heading section-heading--tight" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Atlanta Service Guides</p>
          <h2>Browse focused decor pages for the celebrations and focal moments clients ask about most.</h2>
          <p className="lead">
            These pages cover specific design directions, planning questions, and service details
            for weddings and milestone events across Atlanta.
          </p>
        </div>

        <div className="seo-related-grid">
          {seoPages.map((page, index) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="seo-related-card"
              data-reveal-child
              style={{ ["--reveal-delay" as string]: `${120 + index * 60}ms` }}
            >
              <strong>{page.title}</strong>
              <span>{page.metaDescription}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="simple-package-shell" data-reveal>
        <div className="simple-package-head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Package directions</p>
          <h2>Choose the styling level that fits your event best.</h2>
        </div>
        <div className="simple-package-grid">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="package-card package-card--simple"
              data-reveal-child
              style={{ ["--reveal-delay" as string]: `${120 + index * 80}ms` }}
            >
              <p className="eyebrow">Best for</p>
              <h3>{pkg.name}</h3>
              <p className="muted">{pkg.best_for ?? pkg.summary}</p>
              <Button href="/request">Book Consultation</Button>
            </div>
          ))}
        </div>
        <div className="btn-row" data-reveal-child style={{ ["--reveal-delay" as string]: "360ms" }}>
          <Button href="/packages" variant="secondary">View Package Details</Button>
        </div>
      </section>

      <section data-reveal>
        <GalleryStrip
          title="Visual references from real celebrations."
          items={images.slice(2, 5).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
          showCaption={false}
        />
      </section>

      <PageCTA
        title="Choose the service direction that fits your event, then refine it with us."
        description="From reception styling to Traditional Melsi and milestone events, we help shape the room with clarity, beauty, and thoughtful event flow."
        showSecondary={false}
      />
    </main>
  );
}
