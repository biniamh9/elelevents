import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  calculateQuoteTotals,
  DEFAULT_ITEMIZED_DISCLAIMER,
} from "@/lib/admin-pricing";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import {
  getBusinessTemplateVariables,
  getNotificationFromEmail,
  renderBrandedEmail,
} from "@/lib/email-template-renderer";
import { recordOutboundEmailInteraction } from "@/lib/customer-interactions";
import { createQuoteActionToken } from "@/lib/quote-client-actions";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDisplayDate(value: string | null) {
  if (!value) {
    return "To be confirmed";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeQuotedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function renderItemizedQuoteEmail({
  firstName,
  eventType,
  eventDate,
  venueName,
  quoteMessage,
  lineItems,
  totals,
  disclaimer,
  approveUrl,
  changesUrl,
}: {
  firstName: string;
  eventType: string;
  eventDate: string | null;
  venueName: string | null;
  quoteMessage: string;
  lineItems: Array<{
    item_name: string;
    variant: string | null;
    quantity: number;
    unit_label: string | null;
    unit_price: number;
    line_total: number;
    notes: string | null;
  }>;
  totals: ReturnType<typeof calculateQuoteTotals>;
  disclaimer: string;
  approveUrl: string;
  changesUrl: string;
}) {
  const lineItemsHtml = lineItems.length
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;border:1px solid rgba(121,94,61,0.12);border-radius:22px;overflow:hidden;">
        <thead>
          <tr style="background:#faf4ec;">
            <th align="left" style="padding:14px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d5f52;">Item</th>
            <th align="center" style="padding:14px 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d5f52;">Qty</th>
            <th align="right" style="padding:14px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d5f52;">Unit</th>
            <th align="right" style="padding:14px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d5f52;">Line total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems
            .map(
              (item) => `
                <tr>
                  <td style="padding:16px;border-top:1px solid rgba(121,94,61,0.08);vertical-align:top;">
                    <div style="font-weight:700;color:#241d18;">${escapeHtml(item.item_name)}</div>
                    ${
                      item.variant
                        ? `<div style="font-size:14px;color:#6d5f52;margin-top:4px;">${escapeHtml(item.variant)}</div>`
                        : ""
                    }
                    ${
                      item.notes
                        ? `<div style="font-size:13px;color:#8a7b6c;margin-top:6px;">${escapeHtml(item.notes)}</div>`
                        : ""
                    }
                  </td>
                  <td align="center" style="padding:16px;border-top:1px solid rgba(121,94,61,0.08);color:#241d18;">${item.quantity}</td>
                  <td align="right" style="padding:16px;border-top:1px solid rgba(121,94,61,0.08);color:#241d18;">${escapeHtml(
                    `${formatCurrency(item.unit_price)}${item.unit_label ? ` / ${item.unit_label}` : ""}`
                  )}</td>
                  <td align="right" style="padding:16px;border-top:1px solid rgba(121,94,61,0.08);font-weight:700;color:#241d18;">${escapeHtml(
                    formatCurrency(item.line_total)
                  )}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `
    : `
      <p style="margin:22px 0;color:#6d5f52;">This proposal currently includes planning totals only. We can revise the scope together if you need a more detailed breakdown.</p>
    `;

  const totalsRows = [
    ["Base design fee", totals.baseFee],
    ["Decor line items", totals.lineItemsTotal],
    totals.deliveryFee > 0 ? ["Delivery / setup", totals.deliveryFee] : null,
    totals.laborAdjustment !== 0 ? ["Labor adjustment", totals.laborAdjustment] : null,
    totals.discountAmount > 0 ? ["Discount", -totals.discountAmount] : null,
    totals.taxAmount > 0 ? ["Tax", totals.taxAmount] : null,
  ]
    .filter(Boolean)
    .map(
      (entry) => `
        <tr>
          <td style="padding:0 0 10px;color:#6a5a49;">${escapeHtml(String(entry![0]))}</td>
          <td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(
            formatCurrency(Number(entry![1]))
          )}</td>
        </tr>
      `
    )
    .join("");

  return renderBrandedEmail({
    eyebrow: "Quote / Proposal",
    heading: `Your ${eventType} quote is ready.`,
    intro: `Hello ${firstName}, we prepared an itemized proposal aligned with the event direction discussed together.`,
    body: `
      <p>${escapeHtml(quoteMessage)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;">
        <tr><td>
          <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Proposal summary</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="padding:0 0 10px;color:#6a5a49;">Event</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(eventType)}</td></tr>
              <tr><td style="padding:0 0 10px;color:#6a5a49;">Date</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(formatDisplayDate(eventDate))}</td></tr>
              ${
                venueName
                  ? `<tr><td style="padding:0;color:#6a5a49;">Venue</td><td style="padding:0;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(
                      venueName
                    )}</td></tr>`
                  : ""
              }
            </table>
          </div>
        </td></tr>
      </table>
      ${lineItemsHtml}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;">
        <tr><td>
          <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Pricing totals</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${totalsRows}
              <tr><td style="padding:8px 0 0;border-top:1px solid rgba(121,94,61,0.12);font-size:16px;font-weight:700;color:#241d18;">Total proposal</td><td style="padding:8px 0 0;border-top:1px solid rgba(121,94,61,0.12);text-align:right;font-size:24px;font-weight:700;color:#8c5327;">${escapeHtml(
                formatCurrency(totals.grandTotal)
              )}</td></tr>
            </table>
          </div>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;">
        <tr>
          <td style="padding-right:10px;">
            <a href="${escapeHtml(
              approveUrl
            )}" style="display:block;padding:16px 18px;border-radius:16px;background:#e9792a;color:#ffffff;text-decoration:none;text-align:center;font-weight:700;">Approve Quote</a>
          </td>
          <td style="padding-left:10px;">
            <a href="${escapeHtml(
              changesUrl
            )}" style="display:block;padding:16px 18px;border-radius:16px;border:1px solid rgba(121,94,61,0.18);background:#fffdfa;color:#39261a;text-decoration:none;text-align:center;font-weight:700;">Request Changes</a>
          </td>
        </tr>
      </table>
      <p style="margin-bottom:10px;">Reply to this email if you would like any refinements, removals, or substitutions. Once you confirm the direction, we will prepare the agreement and booking steps.</p>
      <p style="font-size:14px;color:#8a7b6c;">${escapeHtml(disclaimer)}</p>
    `,
    footerNote:
      "Your event date is secured once the proposal is approved, the agreement is signed, and the deposit is received.",
  });
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

    const subject = `Your Event Quote - ${inquiry.event_type} with Elel Events`;
    const emailHtml = renderItemizedQuoteEmail({
      firstName: inquiry.first_name,
      eventType: inquiry.event_type,
      eventDate: inquiry.event_date,
      venueName: inquiry.venue_name,
      quoteMessage,
      lineItems: normalizedLineItems,
      totals,
      disclaimer:
        pricing?.client_disclaimer?.trim() || DEFAULT_ITEMIZED_DISCLAIMER,
      approveUrl,
      changesUrl,
    });

    const { data: sentEmail, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: inquiry.email,
      subject,
      replyTo: fromEmail.includes("<")
        ? fromEmail.match(/<([^>]+)>/)?.[1] ?? fromEmail
        : fromEmail,
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
      senderEmail: fromEmail.includes("<")
        ? fromEmail.match(/<([^>]+)>/)?.[1] ?? fromEmail
        : fromEmail,
      recipientEmail: inquiry.email,
      threadId: sentEmail?.id ?? null,
      messageId: sentEmail?.id ?? null,
      provider: "resend",
      metadata: {
        type: "quote_email",
        quote_amount: quoteAmount,
        approve_url: approveUrl,
        changes_url: changesUrl,
      },
      createdAt: quotedAt,
    });

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      action: "inquiry.quote_sent",
      summary: "Quote email sent to client",
      metadata: {
        quote_amount: quoteAmount,
        line_item_count: normalizedLineItems.length,
        client_email: inquiry.email,
      },
    });

    await syncInquiryWorkflowStage(supabaseAdmin, {
      inquiryId: id,
      actorId: auth.user.id,
      sourceAction: "inquiry.quote_sent",
      note: "Quote was sent to the client.",
      metadata: {
        quote_amount: quoteAmount,
        line_item_count: normalizedLineItems.length,
      },
      updatedAt: quotedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send quote email" }, { status: 500 });
  }
}
