import { z } from "zod";

export const RENTAL_PRICE_TYPES = ["per_item", "per_set", "flat_rate"] as const;
export const RENTAL_DEPOSIT_TYPES = ["flat", "per_item", "percent"] as const;

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
  deposit_required: z.boolean(),
  deposit_type: z.enum(RENTAL_DEPOSIT_TYPES),
  deposit_amount: z.number().finite().min(0),
  replacement_cost: z.number().finite().min(0),
  deposit_terms: z.string().trim().nullable(),
  damage_notes: z.string().trim().nullable(),
  featured: z.boolean(),
  active: z.boolean(),
  sort_order: z.number().int().min(0),
}).superRefine((value, ctx) => {
  if (value.deposit_required && value.deposit_amount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deposit_amount"],
      message: "Deposit amount must be greater than 0 when a refundable deposit is required.",
    });
  }
});

export type RentalItemInput = z.infer<typeof rentalItemInputSchema>;
