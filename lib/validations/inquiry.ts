import { z } from "zod";

function normalizeInquiryInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const record = input as Record<string, unknown>;
  const normalized = { ...record };

  if (typeof record.name === "string") {
    const parts = record.name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!record.firstName && parts.length) {
      normalized.firstName = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(" ");
    }

    if (!record.lastName && parts.length > 1) {
      normalized.lastName = parts.at(-1) ?? "";
    }
  }

  if (record.event_type != null && record.eventType == null) {
    normalized.eventType = record.event_type;
  }

  if (record.event_date != null && record.eventDate == null) {
    normalized.eventDate = record.event_date;
  }

  if (record.guest_count != null && record.guestCount == null) {
    normalized.guestCount = record.guest_count;
  }

  if (record.consultation_preference != null && record.preferredContactMethod == null) {
    normalized.preferredContactMethod = record.consultation_preference;
  }

  if (record.budget_range != null && record.additionalInfo == null) {
    normalized.additionalInfo = `Budget range: ${record.budget_range}`;
  }

  return normalized;
}

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

const requiredPositiveNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  const nextValue =
    typeof value === "string" ? Number(value.trim()) : Number(value);

  return Number.isNaN(nextValue) ? undefined : nextValue;
}, z.number().int().min(1, "Guest count must be at least 1."));

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

export const inquirySchema = z.preprocess(normalizeInquiryInput, z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventType: z.string().min(2),
  eventDate: optionalDate,
  guestCount: requiredPositiveNumber,
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
}));
