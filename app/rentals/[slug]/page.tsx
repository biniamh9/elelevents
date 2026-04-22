import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Card from "@/components/ui/card";
import PageCTA from "@/components/site/page-cta";
import RentalDetailActions from "@/components/site/rental-detail-actions";
import {
  calculateRentalSecurityDeposit,
  formatMoney,
  formatRentalPrice,
  getRentalItemBySlug,
} from "@/lib/rentals";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getRentalItemBySlug(slug);

  if (!item) {
    return {
      title: "Rental item not found | Elel Events & Design",
    };
  }

  return {
    title: `${item.name} | Rentals | Elel Events & Design`,
    description:
      item.short_description ||
      `View pricing, quantity, and service details for ${item.name} rentals from Elel Events & Design.`,
    alternates: {
      canonical: `https://elelevents.com/rentals/${item.slug}`,
    },
  };
}

export default async function RentalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getRentalItemBySlug(slug);

  if (!item || !item.active) {
    notFound();
  }

  const galleryImages = item.images ?? [];
  const securityDeposit = calculateRentalSecurityDeposit({
    quantity: item.minimum_order_quantity,
    subtotal: item.price_type === "flat_rate"
      ? item.base_rental_price
      : item.base_rental_price * item.minimum_order_quantity,
    depositRequired: item.deposit_required,
    depositType: item.deposit_type,
    depositAmount: item.deposit_amount,
  });

  return (
    <main className="container section public-page-shell rental-detail-page">
      <section className="rental-detail-hero">
        <div className="rental-detail-gallery">
          <div className="rental-detail-featured">
            {item.featured_image_url ? (
              <img src={item.featured_image_url} alt={item.name} />
            ) : (
              <div className="rental-detail-placeholder">Rental image</div>
            )}
          </div>

          {galleryImages.length ? (
            <div className="rental-detail-gallery-strip">
              {galleryImages.map((image) => (
                <div key={image.id} className="rental-detail-gallery-thumb">
                  <img src={image.image_url} alt={item.name} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="rental-detail-copy">
          <p className="eyebrow">{item.category || "Rental"}</p>
          <h1>{item.name}</h1>
          <p className="lead">{item.short_description || "Rental details available on request."}</p>

          <div className="rental-detail-meta">
            <div>
              <span>Base price</span>
              <strong>{formatRentalPrice(item.base_rental_price, item.price_type)}</strong>
            </div>
            <div>
              <span>Available quantity</span>
              <strong>{item.available_quantity}</strong>
            </div>
            <div>
              <span>Minimum order</span>
              <strong>{item.minimum_order_quantity}</strong>
            </div>
            <div>
              <span>Refundable deposit</span>
              <strong>{item.deposit_required ? formatMoney(securityDeposit) : "Not required"}</strong>
            </div>
          </div>

          <div className="rental-detail-fees">
            <div><span>Delivery</span><strong>{item.delivery_available ? formatMoney(item.default_delivery_fee) : "Not available"}</strong></div>
            <div><span>Setup</span><strong>{item.setup_available ? formatMoney(item.default_setup_fee) : "Not available"}</strong></div>
            <div><span>Breakdown</span><strong>{item.breakdown_available ? formatMoney(item.default_breakdown_fee) : "Not available"}</strong></div>
          </div>

          <RentalDetailActions item={item} />
        </Card>
      </section>

      <section className="rental-detail-section">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Rental details</p>
          <h2>Built for organized event quoting and clear logistics.</h2>
        </div>
        <div className="public-callout-grid">
          <Card className="public-callout-card">
            <p className="eyebrow">Description</p>
            <h3>What this rental adds</h3>
            <p>{item.full_description || item.short_description || "More details will be confirmed during inquiry review."}</p>
          </Card>
          <Card className="public-callout-card">
            <p className="eyebrow">Logistics</p>
            <h3>Delivery and setup support</h3>
            <p>
              {item.delivery_available || item.setup_available || item.breakdown_available
                ? "Optional logistics fees can be added based on delivery needs, setup complexity, and pickup timing."
                : "This item is currently listed without delivery, setup, or breakdown support."}
            </p>
          </Card>
          <Card className="public-callout-card">
            <p className="eyebrow">Security deposit</p>
            <h3>Refundable damage coverage</h3>
            <p>
              {item.deposit_required
                ? item.deposit_terms || "This rental uses a refundable security deposit that stays separate from rental and logistics charges."
                : "This rental is currently listed without a default refundable security deposit requirement."}
            </p>
          </Card>
          <Card className="public-callout-card">
            <p className="eyebrow">Inquiry flow</p>
            <h3>Quote before booking</h3>
            <p>Use the rental quote CTA to confirm quantity, availability, and final logistics before securing your date.</p>
          </Card>
        </div>
      </section>

      <PageCTA
        eyebrow="Start rental inquiry"
        title="If this item fits your event, we can build the rental quote around quantity and service needs."
        description="Use the inquiry flow to request this rental on its own or alongside a broader event design scope."
      />
    </main>
  );
}
