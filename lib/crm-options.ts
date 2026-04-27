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

export const CRM_LEAD_TEMPERATURES = ["hot", "warm", "cold"] as const;

export type CrmLeadTemperature = (typeof CRM_LEAD_TEMPERATURES)[number];

export function isCrmLostReason(value: string | null | undefined): value is CrmLostReason {
  return Boolean(value && CRM_LOST_REASONS.includes(value as CrmLostReason));
}

export function isCrmLeadTemperature(
  value: string | null | undefined
): value is CrmLeadTemperature {
  return Boolean(value && CRM_LEAD_TEMPERATURES.includes(value as CrmLeadTemperature));
}
