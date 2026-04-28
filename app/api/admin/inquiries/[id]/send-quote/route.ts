import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  calculateQuoteTotals,
  DEFAULT_ITEMIZED_DISCLAIMER,
} from "@/lib/admin-pricing";
import { buildQuoteEmailSentActivityEvent } from "@/lib/email-activity-events";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import {
  buildQuoteEmailActivityMetadata,
  buildQuoteEmailInteractionMetadata,
  buildQuoteEmailWorkflowMetadata,
  extractEmailAddress,
} from "@/lib/email-delivery-metadata";
import { buildInquiryReplyToAddress } from "@/lib/crm-opportunity-identity";
import { buildQuoteProposalEmailVariables } from "@/lib/email-template-variables";
import {
  getBusinessTemplateVariables,
  getNotificationFromEmail,
  renderEmailTemplate,
  renderQuoteItemizedScopeSection,
} from "@/lib/email-template-renderer";
import { recordOutboundEmailInteraction } from "@/lib/customer-interactions";
import { createQuoteActionToken } from "@/lib/quote-client-actions";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function normalizeQuotedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("overview");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();

    const { data: inquiry } = await supabaseAdmin
      .from("event_inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (!resend) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const fromEmail = getNotificationFromEmail();

    const [{ data: pricing }, { data: lineItems }] = await Promise.all([
      supabaseAdmin
        .from("inquiry_quote_pricing")
        .select("*")
        .eq("inquiry_id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("inquiry_quote_line_items")
        .select("*")
        .eq("inquiry_id", id)
        .order("sort_order", { ascending: true }),
    ]);

    const normalizedLineItems = (lineItems ?? []).map((item) => ({
      item_name: item.item_name,
      variant: item.variant,
      quantity: Number(item.quantity ?? 0),
      unit_label: item.unit_label,
      unit_price: Number(item.unit_price ?? 0),
      line_total: Number(item.line_total ?? 0),
      notes: item.notes,
    }));

    const totals = calculateQuoteTotals(pricing, normalizedLineItems);
    const quoteAmount =
      normalizedLineItems.length > 0 || pricing
        ? totals.grandTotal
        : typeof body.quoteAmount === "number"
          ? body.quoteAmount
          : Number(inquiry.estimated_price ?? 0);

    if (!inquiry.email || !quoteAmount || quoteAmount <= 0) {
      return NextResponse.json(
        { error: "Client email and quote amount are required" },
        { status: 400 }
      );
    }

    const quoteMessage =
      typeof body.quoteMessage === "string" && body.quoteMessage.trim()
        ? body.quoteMessage.trim()
        : "Thank you for meeting with us. Based on the event scope we discussed, here is your quote.";

    const quotedAtInput = normalizeQuotedAt(
      inquiry.quoted_at || new Date().toISOString()
    );

    const { data: updatedInquiry, error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        estimated_price: quoteAmount,
        status: "quoted",
        booking_stage: "quote_sent",
        quoted_at: quotedAtInput,
        quote_response_status: "awaiting_response",
      })
      .eq("id", id)
      .select("id, email, quoted_at, client_id")
      .single();

    if (updateError || !updatedInquiry?.quoted_at) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to prepare quote response link" },
        { status: 500 }
      );
    }

    const quotedAt = normalizeQuotedAt(updatedInquiry.quoted_at);
    const siteUrl =
      getBusinessTemplateVariables().website_url ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const quoteActionToken = createQuoteActionToken({
      inquiryId: inquiry.id,
      email: inquiry.email,
      quotedAt,
    });
    const approveUrl = `${siteUrl}/quote/respond?inquiry=${encodeURIComponent(
      inquiry.id
    )}&action=approve&token=${encodeURIComponent(quoteActionToken)}`;
    const changesUrl = `${siteUrl}/quote/respond?inquiry=${encodeURIComponent(
      inquiry.id
    )}&action=request_changes&token=${encodeURIComponent(quoteActionToken)}`;

    const renderedQuote = renderEmailTemplate("quote_proposal", {
      ...buildQuoteProposalEmailVariables({
        customerFirstName: inquiry.first_name,
        eventType: inquiry.event_type,
        eventDate: inquiry.event_date,
        venueName: inquiry.venue_name,
        quoteMessage,
        itemizedScopeHtml: renderQuoteItemizedScopeSection(normalizedLineItems),
        baseDesignFee: totals.baseFee,
        decorLineItems: totals.lineItemsTotal,
        deliverySetupTotal: totals.deliveryFee,
        laborAdjustmentTotal: totals.laborAdjustment,
        discountTotal: totals.discountAmount,
        taxTotal: totals.taxAmount,
        quoteTotal: totals.grandTotal,
        approveUrl,
        changesUrl,
        quoteDisclaimer:
          pricing?.client_disclaimer?.trim() || DEFAULT_ITEMIZED_DISCLAIMER,
      }),
    });
    const subject = renderedQuote.subject;
    const emailHtml = renderedQuote.html;

    const { data: sentEmail, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: inquiry.email,
      subject,
      replyTo: buildInquiryReplyToAddress(
        extractEmailAddress(fromEmail),
        inquiry.crm_conversation_key
      ),
      html: emailHtml,
    });

    if (sendError) {
      console.error("Quote email send failed:", sendError);
      return NextResponse.json(
        { error: sendError.message || "Quote email failed to send" },
        { status: 500 }
      );
    }
    await recordOutboundEmailInteraction(supabaseAdmin, {
      inquiryId: id,
      clientId: updatedInquiry.client_id ?? inquiry.client_id ?? null,
      subject,
      bodyText: quoteMessage,
      senderEmail: extractEmailAddress(fromEmail),
      recipientEmail: inquiry.email,
      conversationKey: inquiry.crm_conversation_key ?? null,
      threadId: sentEmail?.id ?? null,
      messageId: sentEmail?.id ?? null,
      provider: "resend",
      metadata: buildQuoteEmailInteractionMetadata({
        quoteAmount,
        approveUrl,
        changesUrl,
      }),
      createdAt: quotedAt,
    });

    const quoteActivityEvent = buildQuoteEmailSentActivityEvent({
      quoteAmount,
      lineItemCount: normalizedLineItems.length,
      clientEmail: inquiry.email,
    });
    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      ...quoteActivityEvent,
    });

    await syncInquiryWorkflowStage(supabaseAdmin, {
      inquiryId: id,
      actorId: auth.user.id,
      sourceAction: "inquiry.quote_sent",
      note: "Quote was sent to the client.",
      metadata: buildQuoteEmailWorkflowMetadata({
        quoteAmount,
        lineItemCount: normalizedLineItems.length,
      }),
      updatedAt: quotedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send quote email" }, { status: 500 });
  }
}
