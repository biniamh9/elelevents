import Link from "next/link";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { formatMoney, formatRentalPrice, type RentalItem } from "@/lib/rentals";

export default function RentalsGrid({
  items,
}: {
  items: RentalItem[];
}) {
  return (
    <section className="rental-grid-shell">
      <div className="rental-grid">
        {items.map((item) => (
          <Card key={item.id} className="rental-card">
            <Link href={`/rentals/${item.slug}`} className="rental-card-media">
              {item.featured_image_url ? (
                <img src={item.featured_image_url} alt={item.name} />
              ) : (
                <div className="rental-card-media-placeholder">Rental item</div>
              )}
            </Link>

            <div className="rental-card-copy">
              <p className="eyebrow">{item.category || "Rental"}</p>
              <h3>
                <Link href={`/rentals/${item.slug}`}>{item.name}</Link>
              </h3>
              <p>{item.short_description || "Rental item details available on request."}</p>

              <div className="rental-card-meta">
                <strong>{formatRentalPrice(item.base_rental_price, item.price_type)}</strong>
                <span>{item.available_quantity} available</span>
              </div>

              <div className="btn-row">
                <Button href={`/request?service=rentals&item=${item.slug}`}>Request Rental Quote</Button>
                <Button href={`/request?service=rentals&item=${item.slug}`} variant="secondary">
                  Add to Inquiry
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
