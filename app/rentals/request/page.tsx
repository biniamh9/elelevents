import type { Metadata } from "next";

import RentalRequestForm from "@/components/forms/rental-request-form";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import Card from "@/components/ui/card";
import { getRentalItemBySlug, getRentalItems } from "@/lib/rentals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request a Rental Quote | Elel Events & Design",
  description:
    "Request a rental quote for Elel Events inventory, including quantity, logistics, setup, breakdown, and refundable security deposit details.",
  alternates: {
    canonical: "https://elelevents.com/rentals/request",
  },
};

export default async function RentalRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; source?: string }>;
}) {
  const params = await searchParams;
  const selectedSlug = params.item?.trim() || null;
  const source = params.source?.trim().toLowerCase() === "shortlist" ? "shortlist" : "single";
  const items = await getRentalItems({ activeOnly: true });
  const selectedItem = selectedSlug ? await getRentalItemBySlug(selectedSlug) : null;
  const heroImage =
    selectedItem?.featured_image_url ?? items[0]?.featured_image_url ?? undefined;

  return (
    <main className="container section public-page-shell">
      <ImmersivePageHero
        eyebrow="Rental Quote"
        title="Request a rental quote built around quantity, logistics, and refundable deposit terms."
        description="Use the rental-specific form to confirm item selection, delivery and setup needs, and the estimated refundable security deposit before we issue the final quote."
        imageUrl={heroImage}
        imageAlt="Elel Events rental quote request"
        tags={["Rental pricing", "Logistics", "Security deposit"]}
        aside={
          <Card className="gallery-page-note">
            <strong>Rental-only intake</strong>
            <p className="muted">
              This form is for rentals. It separates rental quantity, logistics fees, and refundable security deposit terms from the broader event design request flow.
            </p>
          </Card>
        }
      />

      <RentalRequestForm
        items={items}
        selectedSlug={selectedSlug}
        source={source}
      />
    </main>
  );
}
