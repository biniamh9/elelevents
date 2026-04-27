export const CRM_LOST_REASONS = [
  "Price too high",
  "Chose competitor",
  "No response",
  "Date unavailable",
  "Not ready",
  "Other",
] as const;

export type CrmLostReason = (typeof CRM_LOST_REASONS)[number];

export const CRM_OWNER_SUGGESTIONS = [
  "Biniam",
  "Contracts Desk",
  "Operations",
  "Finance",
] as const;

export function isCrmLostReason(value: string | null | undefined): value is CrmLostReason {
  return Boolean(value && CRM_LOST_REASONS.includes(value as CrmLostReason));
}
