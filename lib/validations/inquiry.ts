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

const decorSelectionSchema = z.object({
  categoryKey: z.string(),
  categoryTitle: z.string(),
  selectedGalleryImageIds: z.array(z.string()).default([]),
  selectedGalleryImages: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        image_url: z.string().url(),
        category: optionalText,
      })
    )
    .default([]),
  uploadedImageUrls: z.array(z.string().url()).default([]),
  refinement: optionalText,
  notes: optionalText,
  sizeOption: optionalText,
  floralDensity: optionalText,
  colorPalette: optionalText,
  inspirationLink: optionalText,
  designerLed: z.boolean().optional().default(false),
});

export const inquirySchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventType: z.string().min(2),
  eventDate: optionalDate,
  guestCount: optionalNumber,
  venueName: optionalText,
  venueStatus: optionalText,
  services: z.array(z.string()).default([]),
  indoorOutdoor: optionalText,
  colorsTheme: optionalText,
  inspirationNotes: optionalText,
  visionBoardUrls: z.array(z.string().url()).optional().default([]),
  selectedDecorCategories: z.array(z.string()).optional().default([]),
  decorSelections: z.array(decorSelectionSchema).optional().default([]),
  additionalInfo: optionalText,
  requestedVendorCategories: z.array(z.string()).optional().default([]),
  vendorRequestNotes: optionalText,
  preferredContactMethod: optionalText,
  consultationPreferenceDate: optionalDate,
  consultationPreferenceTime: optionalText,
  consultationVideoPlatform: optionalText,
  referralSource: optionalText,
  needsDeliverySetup: z.boolean().optional().default(false),
  estimatedPrice: z.number().optional().nullable()
});
