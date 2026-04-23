"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  clearRentalInquiryItems,
  readRentalInquiryItems,
  RENTAL_INQUIRY_UPDATED_EVENT,
  type RentalInquiryItem,
} from "@/lib/rental-inquiry";

export default function RentalInquiryBanner() {
  const [items, setItems] = useState<RentalInquiryItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readRentalInquiryItems());

    sync();
    window.addEventListener(RENTAL_INQUIRY_UPDATED_EVENT, sync);

    return () => window.removeEventListener(RENTAL_INQUIRY_UPDATED_EVENT, sync);
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <Card className="rental-inquiry-banner">
      <div>
        <p className="eyebrow">Inquiry shortlist</p>
        <h3>{items.length} rental {items.length === 1 ? "item" : "items"} saved for inquiry</h3>
        <p className="muted">
          Continue to the inquiry form when you are ready, or keep browsing and add more items first.
        </p>
      </div>

      <div className="rental-inquiry-banner__items">
        {items.slice(0, 4).map((item) => (
          <span key={item.slug} className="rental-inquiry-pill">
            {item.name}
          </span>
        ))}
      </div>

      <div className="btn-row">
          <Button href="/rentals/request?source=shortlist">Request Saved Rentals</Button>
        <Button
          variant="secondary"
          onClick={() => {
            clearRentalInquiryItems();
            setItems([]);
          }}
        >
          Clear
        </Button>
      </div>
    </Card>
  );
}
