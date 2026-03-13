import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
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
      html: `
        <h2>Hello ${inquiry.first_name},</h2>
        <p>${quoteMessage}</p>
        <p><strong>Quoted amount:</strong> $${quoteAmount.toLocaleString()}</p>
        <p><strong>Event:</strong> ${inquiry.event_type}</p>
        <p><strong>Date:</strong> ${inquiry.event_date || "To be confirmed"}</p>
        <p>Please reply to this email if you would like to move forward. Once you confirm, we will send your contract for signature.</p>
        <p>Thank you,<br/>Elel Events</p>
      `,
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
