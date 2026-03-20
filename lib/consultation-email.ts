import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type InquiryConfirmationPayload = {
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate?: string | null;
};

type ScheduledConsultationPayload = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  eventType: string;
  eventDate?: string | null;
  meetingAt: string;
  meetingType: string;
  meetingLocation?: string | null;
  videoLink?: string | null;
};

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function humanizeMeetingType(type: string) {
  if (type === "video_meeting") {
    return "video call";
  }

  if (type === "in_person") {
    return "in person";
  }

  if (type === "phone_call") {
    return "phone call";
  }

  return type.replaceAll("_", " ");
}

export function canSendConsultationEmail() {
  return Boolean(resend && process.env.NOTIFICATION_FROM_EMAIL);
}

export async function sendInquiryConfirmationEmail(payload: InquiryConfirmationPayload) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!process.env.NOTIFICATION_FROM_EMAIL) {
    throw new Error("NOTIFICATION_FROM_EMAIL is not configured");
  }

  const { error } = await resend.emails.send({
    from: process.env.NOTIFICATION_FROM_EMAIL,
    to: payload.clientEmail,
    subject: "Your request has been received – Elel Events & Design",
    html: `
      <h2>Hello ${payload.clientName},</h2>
      <p>Thank you for your request. We have received your event inquiry successfully.</p>
      <p><strong>Event type:</strong> ${payload.eventType}</p>
      <p><strong>Requested date:</strong> ${payload.eventDate || "To be confirmed"}</p>
      <p>Our team will review the details and notify you within 12–24 hours with the next steps.</p>
      <p>Warmly,<br/>Elel Events & Design</p>
    `,
  });

  if (error) {
    throw new Error(error.message || "Inquiry confirmation email failed");
  }
}

export async function sendConsultationScheduledEmails(
  payload: ScheduledConsultationPayload
) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!process.env.NOTIFICATION_FROM_EMAIL) {
    throw new Error("NOTIFICATION_FROM_EMAIL is not configured");
  }

  const meetingLabel = formatDateTime(payload.meetingAt);
  const meetingTypeLabel = humanizeMeetingType(payload.meetingType);
  const customerHtml =
    payload.meetingType === "in_person"
      ? `
        <h2>Hello ${payload.clientName},</h2>
        <p>Your consultation has been scheduled for <strong>${meetingLabel}</strong>.</p>
        <p>This meeting will take place in person at <strong>${payload.meetingLocation}</strong>.</p>
        <p>If anything changes before then, simply reply to this email and we will help you adjust the plan.</p>
        <p>Warmly,<br/>Elel Events & Design</p>
      `
      : payload.meetingType === "video_meeting"
        ? `
          <h2>Hello ${payload.clientName},</h2>
          <p>Your consultation has been scheduled for <strong>${meetingLabel}</strong>.</p>
          <p>This meeting will take place by video call. A meeting link will be sent to you 30 minutes before the consultation.</p>
          ${payload.videoLink ? `<p><strong>Video link:</strong> <a href="${payload.videoLink}">${payload.videoLink}</a></p>` : ""}
          <p>Warmly,<br/>Elel Events & Design</p>
        `
        : `
          <h2>Hello ${payload.clientName},</h2>
          <p>Your consultation has been scheduled for <strong>${meetingLabel}</strong>.</p>
          <p>This meeting will take place by ${meetingTypeLabel}.</p>
          <p>Warmly,<br/>Elel Events & Design</p>
        `;

  const adminTo = process.env.NOTIFICATION_TO_EMAIL;
  const sends = [
    resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL,
      to: payload.clientEmail,
      subject: "Your consultation has been scheduled – Elel Events & Design",
      html: customerHtml,
    }),
  ];

  if (adminTo) {
    sends.push(
      resend.emails.send({
        from: process.env.NOTIFICATION_FROM_EMAIL,
        to: adminTo,
        subject: `New consultation scheduled – ${payload.clientName}`,
        html: `
          <h2>New consultation scheduled</h2>
          <p><strong>Customer:</strong> ${payload.clientName}</p>
          <p><strong>Email:</strong> ${payload.clientEmail}</p>
          <p><strong>Phone:</strong> ${payload.clientPhone || "—"}</p>
          <p><strong>Event type:</strong> ${payload.eventType}</p>
          <p><strong>Event date:</strong> ${payload.eventDate || "—"}</p>
          <p><strong>Meeting date & time:</strong> ${meetingLabel}</p>
          <p><strong>Meeting type:</strong> ${meetingTypeLabel}</p>
          <p><strong>Location:</strong> ${payload.meetingLocation || "—"}</p>
          <p><strong>Video link:</strong> ${payload.videoLink || "Will be sent later"}</p>
        `,
      })
    );
  }

  const results = await Promise.all(sends);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message || "Consultation scheduling email failed");
  }
}

