import { NextResponse } from "next/server";
import { recordInboundEmailReply } from "@/lib/customer-interactions";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type InboundReplyPayload = {
  from?: string;
  fromEmail?: string;
  to?: string;
  toEmail?: string;
  subject?: string;
  text?: string;
  textBody?: string;
  plainText?: string;
  html?: string;
  htmlBody?: string;
  threadId?: string;
  thread_id?: string;
  gmailThreadId?: string;
  messageId?: string;
  message_id?: string;
  gmailMessageId?: string;
  inReplyTo?: string;
  in_reply_to?: string;
  references?: string[] | string;
  provider?: string;
  receivedAt?: string;
  received_at?: string;
  metadata?: Record<string, unknown>;
  envelope?: {
    from?: string;
    to?: string;
  };
};

function extractEmailAddress(value: string | undefined | null) {
  if (!value) return "";
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function normalizeInboundReplyPayload(body: InboundReplyPayload) {
  const fromEmail = extractEmailAddress(
    body.fromEmail ?? body.from ?? body.envelope?.from ?? null
  );
  const toEmail = extractEmailAddress(
    body.toEmail ?? body.to ?? body.envelope?.to ?? null
  );
  const bodyText =
    body.text?.trim() ||
    body.textBody?.trim() ||
    body.plainText?.trim() ||
    "";

  return {
    fromEmail,
    toEmail: toEmail || null,
    subject: body.subject ?? null,
    bodyText,
    bodyHtml: body.html ?? body.htmlBody ?? null,
    threadId: body.threadId ?? body.thread_id ?? body.gmailThreadId ?? null,
    messageId: body.messageId ?? body.message_id ?? body.gmailMessageId ?? null,
    inReplyTo: body.inReplyTo ?? body.in_reply_to ?? null,
    references: Array.isArray(body.references)
      ? body.references
      : typeof body.references === "string"
        ? body.references
            .split(/[,\s]+/)
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    provider: body.provider ?? "inbound-webhook",
    receivedAt: body.receivedAt ?? body.received_at ?? null,
    metadata: body.metadata ?? {},
  };
}

function getSecretFromRequest(request: Request) {
  return (
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-elel-webhook-secret") ||
    ""
  );
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.EMAIL_INBOUND_WEBHOOK_SECRET?.trim();
    const providedSecret = getSecretFromRequest(request).trim();

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
    }

    const body = (await request.json()) as InboundReplyPayload;
    const normalized = normalizeInboundReplyPayload(body);

    if (!normalized.fromEmail || !normalized.bodyText) {
      return NextResponse.json(
        { error: "from and text are required to record an inbound reply" },
        { status: 400 }
      );
    }

    // TODO: Extend this normalizer for the exact inbound provider payload
    // selected in production (Gmail Apps Script, Google Workspace, Resend, etc).
    const result = await recordInboundEmailReply(supabaseAdmin, normalized);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Inbound email reply webhook failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process inbound email reply",
      },
      { status: 500 }
    );
  }
}
