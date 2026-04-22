import type { RentalItem } from "@/lib/rental-shared";

export const RENTAL_INQUIRY_STORAGE_KEY = "elel-events-rental-inquiry";
export const RENTAL_INQUIRY_UPDATED_EVENT = "elel-events:rental-inquiry-updated";

export type RentalInquiryItem = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  base_rental_price: number;
  price_type: RentalItem["price_type"];
  minimum_order_quantity: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeItem(item: RentalItem): RentalInquiryItem {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    base_rental_price: item.base_rental_price,
    price_type: item.price_type,
    minimum_order_quantity: item.minimum_order_quantity,
  };
}

export function readRentalInquiryItems() {
  if (!isBrowser()) {
    return [] as RentalInquiryItem[];
  }

  try {
    const raw = window.localStorage.getItem(RENTAL_INQUIRY_STORAGE_KEY);
    if (!raw) {
      return [] as RentalInquiryItem[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RentalInquiryItem[]) : [];
  } catch {
    return [] as RentalInquiryItem[];
  }
}

function writeRentalInquiryItems(items: RentalInquiryItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(RENTAL_INQUIRY_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(RENTAL_INQUIRY_UPDATED_EVENT));
}

export function addRentalInquiryItem(item: RentalItem) {
  const current = readRentalInquiryItems();
  if (current.some((entry) => entry.slug === item.slug)) {
    return current;
  }

  const next = [...current, normalizeItem(item)];
  writeRentalInquiryItems(next);
  return next;
}

export function removeRentalInquiryItem(slug: string) {
  const next = readRentalInquiryItems().filter((item) => item.slug !== slug);
  writeRentalInquiryItems(next);
  return next;
}

export function clearRentalInquiryItems() {
  writeRentalInquiryItems([]);
}
