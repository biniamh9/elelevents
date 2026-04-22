import { z } from "zod";

export const RENTAL_PRICE_TYPES = ["per_item", "per_set", "flat_rate"] as const;

export const rentalItemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  category: z.string().trim().nullable(),
  short_description: z.string().trim().nullable(),
  full_description: z.string().trim().nullable(),
  base_rental_price: z.number().finite().min(0),
  price_type: z.enum(RENTAL_PRICE_TYPES),
  available_quantity: z.number().int().min(0),
  minimum_order_quantity: z.number().int().min(1),
  delivery_available: z.boolean(),
  setup_available: z.boolean(),
  breakdown_available: z.boolean(),
  default_delivery_fee: z.number().finite().min(0),
  default_setup_fee: z.number().finite().min(0),
  default_breakdown_fee: z.number().finite().min(0),
  featured: z.boolean(),
  active: z.boolean(),
  sort_order: z.number().int().min(0),
});

export type RentalItemInput = z.infer<typeof rentalItemInputSchema>;
