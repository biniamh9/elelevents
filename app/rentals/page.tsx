import Link from "next/link";
import type { Metadata } from "next";

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
  const items = await getRentalItems({ activeOnly: true, category: selectedCategory });
  const allItems = await getRentalItems({ activeOnly: true });
  const categories = getRentalCategories(allItems);

  return (
    <main className="container section public-page-shell">
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

      <section className="rental-filter-shell">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Browse inventory</p>
          <h2>Filter by rental category.</h2>
        </div>
        <div className="rental-filter-chips">
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

      <RentalInquiryBanner />

      <RentalsGrid items={items} />

      <PageCTA
        eyebrow="Rental inquiry"
        title="Choose the pieces you need, then let us shape the quote around quantity and logistics."
        description="If you need rentals only or rentals as part of a broader design scope, start with availability and we will help define the right next step."
      />
    </main>
  );
}
