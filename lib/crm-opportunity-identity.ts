const CONVERSATION_KEY_PREFIX = "inq_";

function sanitizeConversationToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function buildInquiryConversationKey(inquiryId: string) {
  return `${CONVERSATION_KEY_PREFIX}${sanitizeConversationToken(inquiryId)}`;
}

export function normalizeConversationKey(value: string | null | undefined) {
  if (!value) return null;
  const normalized = sanitizeConversationToken(value);
  return normalized || null;
}

export function extractConversationKeyFromAddress(value: string | null | undefined) {
  if (!value) return null;
  const email = value.trim().toLowerCase();
  const match = email.match(/\+([a-z0-9_-]+)@/i);
  if (!match?.[1]) return null;
  return normalizeConversationKey(match[1]);
}

export function buildInquiryReplyToAddress(
  baseEmail: string,
  conversationKey: string | null | undefined
) {
  const normalizedKey = normalizeConversationKey(conversationKey);
  if (!normalizedKey) {
    return baseEmail;
  }

  const match = baseEmail.match(/^(.*)<([^>]+)>$/);
  const address = match?.[2]?.trim() ?? baseEmail.trim();
  const label = match?.[1]?.trim() ?? "";
  const [localPart, domain] = address.split("@");

  if (!localPart || !domain) {
    return baseEmail;
  }

  const alias = `${localPart.split("+")[0]}+${normalizedKey}@${domain}`;
  return label ? `${label} <${alias}>` : alias;
}
