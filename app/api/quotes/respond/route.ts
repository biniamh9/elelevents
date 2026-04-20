import { NextResponse } from "next/server";
import { upsertFollowUpTask } from "@/lib/crm-follow-up-tasks";
import { recordCustomerInteraction } from "@/lib/customer-interactions";
import { verifyQuoteActionToken } from "@/lib/quote-client-actions";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

type QuoteResponseAction = "approve" | "request_changes";

function normalizeAction(value: unknown): QuoteResponseAction | null {
  return value === "approve" || value === "request_changes" ? value : null;
}

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function buildResponsePageUrl(
  request: Request,
  params: {
    inquiryId: string;
    action: QuoteResponseAction;
    token: string;
    result: "success" | "error";
    message?: string;
  }
) {
  const url = new URL("/quote/respond", request.url);
  url.searchParams.set("inquiry", params.inquiryId);
  url.searchParams.set("action", params.action);
  url.searchParams.set("token", params.token);
  url.searchParams.set("result", params.result);
  if (params.message) {
    url.searchParams.set("message", params.message);
  }
  return url;
}

function redirectToResponsePage(
  request: Request,
  params: {
    inquiryId: string;
    action: QuoteResponseAction;
    token: string;
    result: "success" | "error";
    message?: string;
  }
) {
  return NextResponse.redirect(buildResponsePageUrl(request, params), {
    status: 303,
  });
}

export async function POST(request: Request) {
  try {
    const body = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : "";
    const token = typeof body.token === "string" ? body.token : "";
    const action = normalizeAction(body.action);
    const comment =
      typeof body.comment === "string" && body.comment.trim()
        ? body.comment.trim()
        : null;

    if (!inquiryId || !token || !action) {
      if (isFormRequest(request)) {
        return redirectToResponsePage(request, {
          inquiryId,
          token,
          action: action ?? "approve",
          result: "error",
          message: "Missing required quote response fields.",
        });
      }
      return NextResponse.json({ error: "inquiryId, token, and action are required" }, { status: 400 });
    }

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("id, client_id, first_name, last_name, email, quote_response_status, quoted_at, status, booking_stage")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      if (isFormRequest(request)) {
        return redirectToResponsePage(request, {
          inquiryId,
          token,
          action,
          result: "error",
          message: "Quote record not found.",
        });
      }
      return NextResponse.json({ error: "Quote record not found" }, { status: 404 });
    }

    if (!inquiry.email || !inquiry.quoted_at) {
      if (isFormRequest(request)) {
        return redirectToResponsePage(request, {
          inquiryId,
          token,
          action,
          result: "error",
          message: "Quote email actions are not available for this inquiry yet.",
        });
      }
      return NextResponse.json({ error: "Quote email actions are not available for this inquiry yet" }, { status: 400 });
    }

    const isValidToken = verifyQuoteActionToken(token, {
      inquiryId: inquiry.id,
      email: inquiry.email,
      quotedAt: inquiry.quoted_at,
    });

    if (!isValidToken) {
      if (isFormRequest(request)) {
        return redirectToResponsePage(request, {
          inquiryId,
          token,
          action,
          result: "error",
          message: "This quote link is invalid or expired.",
        });
      }
      return NextResponse.json({ error: "This quote link is invalid or expired." }, { status: 401 });
    }

    const nextQuoteStatus =
      action === "approve" ? "accepted" : "changes_requested";

    const { error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        quote_response_status: nextQuoteStatus,
        booking_stage:
          action === "approve" && inquiry.booking_stage === "quote_sent"
            ? "quote_sent"
            : inquiry.booking_stage,
      })
      .eq("id", inquiryId);

    if (updateError) {
      if (isFormRequest(request)) {
        return redirectToResponsePage(request, {
          inquiryId,
          token,
          action,
          result: "error",
          message: updateError.message,
        });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const interactionBody =
      action === "approve"
        ? comment
          ? `Client approved the quote and added a note: ${comment}`
          : "Client approved the quote from the emailed proposal link."
        : comment
          ? `Client requested changes: ${comment}`
          : "Client requested changes from the emailed proposal link.";

    await recordCustomerInteraction(supabaseAdmin, {
      inquiryId,
      clientId: inquiry.client_id ?? null,
      channel: "other",
      direction: "inbound",
      subject:
        action === "approve"
          ? "Quote approved by client"
          : "Quote changes requested by client",
      bodyText: interactionBody,
      senderEmail: inquiry.email,
      metadata: {
        source: "quote_email_action",
        action,
      },
    });

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: inquiryId,
      action:
        action === "approve"
          ? "inquiry.quote_accepted"
          : "inquiry.quote_changes_requested",
      summary:
        action === "approve"
          ? "Client approved the quote"
          : "Client requested quote changes",
      metadata: {
        client_email: inquiry.email,
        comment,
      },
    });

    await upsertFollowUpTask(supabaseAdmin, {
      inquiryId,
      clientId: inquiry.client_id ?? null,
      title:
        action === "approve"
          ? "Prepare contract and booking steps"
          : "Revise quote per client request",
      detail:
        action === "approve"
          ? comment
            ? `Client approved the quote and added a note: ${comment}`
            : "Client approved the quote. Prepare the agreement, deposit steps, and booking follow-up."
          : comment
            ? `Client requested quote changes: ${comment}`
            : "Client requested changes to the quoted scope and pricing.",
      taskKind: action === "approve" ? "quote_approval" : "quote_changes",
      dueAt: new Date(
        Date.now() + (action === "approve" ? 24 : 4) * 60 * 60 * 1000
      ).toISOString(),
      sourceAction:
        action === "approve"
          ? "inquiry.quote_accepted"
          : "inquiry.quote_changes_requested",
    });

    await syncInquiryWorkflowStage(supabaseAdmin, {
      inquiryId,
      actorId: null,
      sourceAction:
        action === "approve"
          ? "inquiry.quote_accepted"
          : "inquiry.quote_changes_requested",
      note: interactionBody,
      metadata: {
        quote_response_status: nextQuoteStatus,
      },
    });

    const successMessage =
      action === "approve"
        ? "Quote approved successfully."
        : "Change request submitted successfully.";

    if (isFormRequest(request)) {
      return redirectToResponsePage(request, {
        inquiryId,
        token,
        action,
        result: "success",
        message: successMessage,
      });
    }

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error) {
    console.error("Quote response failed:", error);
    if (isFormRequest(request)) {
      const url = new URL("/quote/respond", request.url);
      url.searchParams.set("result", "error");
      url.searchParams.set("message", "Failed to process quote response");
      return NextResponse.redirect(url, { status: 303 });
    }
    return NextResponse.json(
      { error: "Failed to process quote response" },
      { status: 500 }
    );
  }
}
