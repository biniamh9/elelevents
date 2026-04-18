import crypto from "node:crypto";

function getQuoteActionSecret() {
  return (
    process.env.QUOTE_ACTION_SECRET?.trim() ||
    process.env.EMAIL_INBOUND_WEBHOOK_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "local-elel-quote-action-secret"
  );
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createQuoteActionToken(input: {
  inquiryId: string;
  email: string;
  quotedAt: string;
}) {
  const payload = `${input.inquiryId}|${input.email.trim().toLowerCase()}|${input.quotedAt}`;
  const signature = crypto
    .createHmac("sha256", getQuoteActionSecret())
    .update(payload)
    .digest("hex");

  return `${encode(payload)}.${signature}`;
}

export function verifyQuoteActionToken(
  token: string,
  expected: {
    inquiryId: string;
    email: string;
    quotedAt: string;
  }
) {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedPayload = `${expected.inquiryId}|${expected.email
    .trim()
    .toLowerCase()}|${expected.quotedAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", getQuoteActionSecret())
    .update(expectedPayload)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    )
  ) {
    return false;
  }

  return decode(encodedPayload) === expectedPayload;
}

