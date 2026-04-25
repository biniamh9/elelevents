import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildAdminEventRequestEmailVariables } from "@/lib/email-template-variables";
import {
  escapeHtml,
  renderEmailTemplate,
} from "@/lib/email-template-renderer";

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

    const renderedEmail = renderEmailTemplate(
      "admin_event_request",
      buildAdminEventRequestEmailVariables({
        name,
        email,
        phone,
        eventDate,
        guestCount,
        notesHtml: escapeHtml(notes || "No notes submitted.").replace(/\n/g, "<br />"),
      })
    );

    const { error } = await resend.emails.send({
      from: "Elel Events <info@elelevents.com>",
      to: ["info@elelevents.com"],
      subject: renderedEmail.subject,
      html: renderedEmail.html,
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
