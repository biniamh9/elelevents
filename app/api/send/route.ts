import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderBrandedEmail } from "@/lib/email-template-renderer";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type SendPayload = {
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string;
  guestCount?: number | string | null;
  notes?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    if (!resend) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as SendPayload;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const eventDate = body.eventDate?.trim() ?? "";
    const guestCount =
      body.guestCount === null || body.guestCount === undefined || body.guestCount === ""
        ? "N/A"
        : String(body.guestCount);
    const notes = body.notes?.trim() ?? "";

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "Elel Events <info@elelevents.com>",
      to: ["info@elelevents.com"],
      subject: "New Event Request",
      html: renderBrandedEmail({
        eyebrow: "New Event Request",
        heading: "A new event request has been submitted.",
        intro: "A new lead came in through the Elel Events request form and is ready for review.",
        body: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr><td style="padding:0 0 18px;">
              <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">Lead details</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Name</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(name)}</td></tr>
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Email</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(email)}</td></tr>
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Phone</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(phone)}</td></tr>
                  <tr><td style="padding:0 0 10px;color:#6a5a49;">Event date</td><td style="padding:0 0 10px;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(eventDate || "N/A")}</td></tr>
                  <tr><td style="padding:0;color:#6a5a49;">Guest count</td><td style="padding:0;text-align:right;font-weight:700;color:#241d18;">${escapeHtml(guestCount)}</td></tr>
                </table>
              </div>
            </td></tr>
            <tr><td>
              <div style="padding:20px 22px;border:1px solid rgba(121,94,61,0.12);border-radius:22px;background:#fffdfa;">
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:12px;">Notes</div>
                <div style="color:#342c25;line-height:1.8;">${escapeHtml(notes || "No notes submitted.").replace(/\n/g, "<br />")}</div>
              </div>
            </td></tr>
          </table>
        `,
        footerNote: "Review this lead in the admin workspace to continue follow-up and consultation scheduling.",
      }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send route failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email." },
      { status: 500 }
    );
  }
}
