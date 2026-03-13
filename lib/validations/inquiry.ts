import { z } from "zod";

export const inquirySchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventType: z.string().min(2),
  eventDate: z.string().optional().nullable(),
  guestCount: z.coerce.number().optional().nullable(),
  venueName: z.string().optional().nullable(),
  venueStatus: z.string().optional().nullable(),
  services: z.array(z.string()).default([]),
  indoorOutdoor: z.string().optional().nullable(),
  colorsTheme: z.string().optional().nullable(),
  inspirationNotes: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  preferredContactMethod: z.string().optional().nullable(),
  referralSource: z.string().optional().nullable(),
  needsDeliverySetup: z.boolean().optional().default(false),
  estimatedPrice: z.number().optional().nullable()
});
