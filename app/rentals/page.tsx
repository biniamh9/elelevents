import Link from "next/link";
import type { Metadata } from "next";

import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import PageCTA from "@/components/site/page-cta";
import RentalInquiryBanner from "@/components/site/rental-inquiry-banner";
import RentalsGrid from "@/components/site/rentals-grid";
import Card from "@/components/ui/card";
import { getRentalCategories, getRentalItems } from "@/lib/rentals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rental Inventory | Elel Events & Design",
  description:
    "Browse premium rental inventory from Elel Events & Design, including chairs, decor focal pieces, and event-ready styling assets available in Atlanta.",
  alternates: {
    canonical: "https://elelevents.com/rentals",
  },
};

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || null;
  const items = (await getRentalItems({ activeOnly: true, category: selectedCategory })).filter(
    (item) => item.available_quantity > 0
  );
  const allItems = (await getRentalItems({ activeOnly: true })).filter(
    (item) => item.available_quantity > 0
  );
  const categories = getRentalCategories(allItems);

  return (
    <main className="container section public-page-shell">
      <CinematicHomeMotion />
      <ImmersivePageHero
        eyebrow="Rentals"
        title="Luxury rental inventory for celebrations that need polish, structure, and visual presence."
        description="Browse premium event rentals from Elel Events & Design, from seating to styled decor assets, with a quote-ready process that keeps pricing and logistics clear."
        imageUrl={items[0]?.featured_image_url ?? allItems[0]?.featured_image_url ?? undefined}
        imageAlt="Premium event rentals by Elel Events"
        tags={["Chiavari chairs", "Decor rentals", "Atlanta"]}
        aside={
          <Card className="gallery-page-note">
            <strong>Rental quote support</strong>
            <p className="muted">
              Delivery, setup, and breakdown options are available on qualifying items and can be added to the same inquiry flow.
            </p>
          </Card>
        }
      />

      <section className="rental-filter-shell" data-reveal>
        <div className="section-heading section-heading--tight" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <p className="eyebrow">Browse inventory</p>
          <h2>Filter by rental category.</h2>
        </div>
        <div className="rental-filter-chips" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
          <Link href="/rentals" className={`rental-filter-chip${!selectedCategory ? " is-active" : ""}`}>All rentals</Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/rentals?category=${encodeURIComponent(category)}`}
              className={`rental-filter-chip${selectedCategory === category ? " is-active" : ""}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section data-reveal>
        <RentalInquiryBanner />
      </section>

      {items.length ? (
        <section data-reveal>
          <RentalsGrid items={items} />
        </section>
      ) : (
        <section className="rental-grid-shell" data-reveal>
          <Card className="admin-empty-state" data-reveal-child>
            <strong>No in-stock rentals in this category right now</strong>
            <p className="muted">
              We only show active inventory that is currently available to quote. Try another category
              or request a rental quote and we can confirm upcoming availability.
            </p>
            <div className="btn-row">
              <Link href="/rentals" className="btn secondary">
                View all rentals
              </Link>
              <Link href="/rentals/request" className="btn">
                Request Rental Quote
              </Link>
            </div>
          </Card>
        </section>
      )}

      <PageCTA
        eyebrow="Rental inquiry"
        title="Choose the pieces you need, then let us shape the quote around quantity and logistics."
        description="If you need rentals only or rentals as part of a broader design scope, start with availability and we will help define the right next step."
      />
    </main>
  );
}
