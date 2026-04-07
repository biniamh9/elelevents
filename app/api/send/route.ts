import { NextResponse } from "next/server";
import { Resend } from "resend";

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
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #231f1b; line-height: 1.6;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">New Event Request</h1>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Event Date:</strong> ${escapeHtml(eventDate || "N/A")}</p>
          <p><strong>Guest Count:</strong> ${escapeHtml(guestCount)}</p>
          <p><strong>Notes:</strong><br />${escapeHtml(notes || "N/A").replace(/\n/g, "<br />")}</p>
        </div>
      `,
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
