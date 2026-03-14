export const VENDOR_SERVICE_CATEGORIES = [
  "Catering",
  "Sound system",
  "Videographer",
  "Photographer",
  "Party planner",
  "Venue",
  "DJ",
  "Cake designer",
  "Makeup artist",
  "Transportation",
  "Other",
] as const;

export type VendorServiceCategory = (typeof VENDOR_SERVICE_CATEGORIES)[number];

export const VENDOR_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "suspended",
] as const;

export const VENDOR_MEMBERSHIP_STATUSES = [
  "none",
  "trial",
  "active",
  "past_due",
  "canceled",
] as const;

export const VENDOR_REFERRAL_STATUSES = [
  "sent",
  "viewed",
  "accepted",
  "declined",
  "charged",
] as const;
