export type InquiryFollowUpDetails = {
  selected_styles?: string[];
  inspiration_links?: string[];
  uploaded_urls?: string[];
  note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizeInquiryFollowUpDetails(
  value: unknown
): InquiryFollowUpDetails | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const normalized: InquiryFollowUpDetails = {
    selected_styles: normalizeStringArray(source.selected_styles),
    inspiration_links: normalizeStringArray(source.inspiration_links),
    uploaded_urls: normalizeStringArray(source.uploaded_urls),
    note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : null,
    submitted_at:
      typeof source.submitted_at === "string" && source.submitted_at.trim()
        ? source.submitted_at.trim()
        : null,
    reviewed_at:
      typeof source.reviewed_at === "string" && source.reviewed_at.trim()
        ? source.reviewed_at.trim()
        : null,
  };

  const hasData =
    normalized.selected_styles?.length ||
    normalized.inspiration_links?.length ||
    normalized.uploaded_urls?.length ||
    normalized.note ||
    normalized.submitted_at ||
    normalized.reviewed_at;

  return hasData ? normalized : null;
}

export function inquiryFollowUpNeedsReview(value: InquiryFollowUpDetails | null) {
  if (!value?.submitted_at) {
    return false;
  }

  const submittedAt = Date.parse(value.submitted_at);
  const reviewedAt = value.reviewed_at ? Date.parse(value.reviewed_at) : null;

  if (!Number.isFinite(submittedAt)) {
    return false;
  }

  if (!reviewedAt || !Number.isFinite(reviewedAt)) {
    return true;
  }

  return reviewedAt < submittedAt;
}
