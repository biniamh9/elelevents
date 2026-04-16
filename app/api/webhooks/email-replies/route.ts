import { NextResponse } from "next/server";
import { recordInboundEmailReply } from "@/lib/customer-interactions";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type InboundReplyPayload = {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  threadId?: string;
  messageId?: string;
  provider?: string;
  receivedAt?: string;
  metadata?: Record<string, unknown>;
};

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
    const fromEmail = body.from?.trim();
    const bodyText = body.text?.trim();

    if (!fromEmail || !bodyText) {
      return NextResponse.json(
        { error: "from and text are required to record an inbound reply" },
        { status: 400 }
      );
    }

    // TODO: Replace this generic payload with provider-specific normalization
    // once Gmail / Microsoft 365 / Resend inbound parsing is selected.
    const result = await recordInboundEmailReply(supabaseAdmin, {
      fromEmail,
      toEmail: body.to ?? null,
      subject: body.subject ?? null,
      bodyText,
      bodyHtml: body.html ?? null,
      threadId: body.threadId ?? null,
      messageId: body.messageId ?? null,
      provider: body.provider ?? "inbound-webhook",
      receivedAt: body.receivedAt ?? null,
      metadata: body.metadata ?? {},
    });

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
