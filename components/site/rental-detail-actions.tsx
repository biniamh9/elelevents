"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/button";
import { addRentalInquiryItem, readRentalInquiryItems } from "@/lib/rental-inquiry";
import type { RentalItem } from "@/lib/rental-shared";

export default function RentalDetailActions({
  item,
}: {
  item: RentalItem;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(readRentalInquiryItems().some((entry) => entry.slug === item.slug));
  }, [item.slug]);

  return (
    <div className="btn-row">
      <Button href={`/request?service=rentals&item=${item.slug}`}>Request Rental Quote</Button>
      <Button
        variant="secondary"
        onClick={() => {
          addRentalInquiryItem(item);
          setAdded(true);
        }}
        aria-pressed={added}
      >
        {added ? "Saved to Inquiry" : "Save to Inquiry"}
      </Button>
    </div>
  );
}
