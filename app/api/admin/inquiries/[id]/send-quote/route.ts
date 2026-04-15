import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { renderBrandedEmail } from "@/lib/email-template-renderer";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
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

    if (!process.env.NOTIFICATION_FROM_EMAIL) {
      return NextResponse.json(
        { error: "NOTIFICATION_FROM_EMAIL is not configured" },
        { status: 500 }
      );
    }

    const quoteAmount =
      typeof body.quoteAmount === "number"
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

    const { error: sendError } = await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL,
      to: inquiry.email,
      subject: `Your Event Quote - ${inquiry.event_type} with Elel Events`,
      html: renderBrandedEmail({
        eyebrow: "Quote / Proposal",
        heading: `Your ${inquiry.event_type} quote is ready.`,
        intro: `Hello ${inquiry.first_name}, we prepared a proposal aligned with the event direction discussed together.`,
        body: `
          <p>${quoteMessage}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;">
            <tr><td>
              <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Proposal summary</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Event</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${inquiry.event_type}</td></tr>
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Date</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${inquiry.event_date || "To be confirmed"}</td></tr>
                  <tr><td style="padding:0;color:#6a5a49;">Quoted amount</td><td style="padding:0;text-align:right;font-size:22px;font-weight:700;color:#8c5327;">$${quoteAmount.toLocaleString()}</td></tr>
                </table>
              </div>
            </td></tr>
          </table>
          <p>Please reply to this email if you would like to move forward or want any refinements. Once you confirm, we will prepare the agreement and next booking steps.</p>
        `,
        footerNote: "Your event date is held once the proposal is approved, the agreement is signed, and the deposit is received.",
      }),
    });

    if (sendError) {
      console.error("Quote email send failed:", sendError);
      return NextResponse.json(
        { error: sendError.message || "Quote email failed to send" },
        { status: 500 }
      );
    }

    const quotedAt = inquiry.quoted_at || new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("event_inquiries")
      .update({
        estimated_price: quoteAmount,
        status: "quoted",
        booking_stage: "quote_sent",
        quoted_at: quotedAt,
        quote_response_status: "awaiting_response",
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "inquiry",
      entityId: id,
      action: "inquiry.quote_sent",
      summary: "Quote email sent to client",
      metadata: {
        quote_amount: quoteAmount,
        client_email: inquiry.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send quote email" }, { status: 500 });
  }
}
