import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().optional().nullable());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().optional().nullable());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  const nextValue =
    typeof value === "string" ? Number(value.trim()) : Number(value);

  return Number.isNaN(nextValue) ? null : nextValue;
}, z.number().optional().nullable());

export const RENTAL_REQUEST_STATUSES = [
  "requested",
  "reviewing",
  "quoted",
  "reserved",
  "completed",
  "cancelled",
] as const;

export const rentalRequestItemSchema = z.object({
  rentalItemId: z.string().uuid().optional().nullable(),
  slug: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  priceType: z.enum(["per_item", "per_set", "flat_rate"]),
  lineSubtotal: z.number().min(0),
  securityDeposit: z.number().min(0).default(0),
});

export const rentalRequestSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventDate: optionalDate,
  venueName: optionalText,
  occasionLabel: optionalText,
  guestCount: optionalNumber,
  notes: optionalText,
  includeDelivery: z.boolean().default(false),
  includeSetup: z.boolean().default(false),
  includeBreakdown: z.boolean().default(false),
  subtotal: z.number().min(0),
  deliveryFee: z.number().min(0),
  setupFee: z.number().min(0),
  breakdownFee: z.number().min(0),
  securityDeposit: z.number().min(0),
  total: z.number().min(0),
  items: z.array(rentalRequestItemSchema).min(1),
});

export type RentalRequestInput = z.infer<typeof rentalRequestSchema>;
export type RentalRequestItemInput = z.infer<typeof rentalRequestItemSchema>;
