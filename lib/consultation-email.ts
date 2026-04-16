import { Resend } from "resend";
import { getNotificationFromEmail, renderEmailTemplate } from "@/lib/email-template-renderer";

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

type VideoReminderPayload = {
  clientName: string;
  clientEmail: string;
  meetingAt: string;
  videoLink: string;
};

function formatMeetingDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeZone: "America/New_York",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMeetingTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function humanizeMeetingType(type: string) {
  if (type === "video_meeting") return "video call";
  if (type === "in_person") return "in person";
  if (type === "phone_call") return "phone call";
  return type.replaceAll("_", " ");
}

export function canSendConsultationEmail() {
  return Boolean(resend);
}

async function sendRenderedEmail(to: string, subject: string, html: string, text: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const fromEmail = getNotificationFromEmail();

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Email failed to send");
  }
}

export async function sendInquiryConfirmationEmail(payload: InquiryConfirmationPayload) {
  const [firstName] = payload.clientName.split(" ");
  const rendered = renderEmailTemplate("request_submitted", {
    customer_first_name: firstName,
    customer_full_name: payload.clientName,
    event_type: payload.eventType,
    event_date: payload.eventDate || "To be confirmed",
    response_window: "12–24 hours",
  });

  await sendRenderedEmail(
    payload.clientEmail,
    rendered.subject,
    rendered.html,
    rendered.text
  );
}

export async function sendConsultationScheduledEmails(
  payload: ScheduledConsultationPayload
) {
  const [firstName] = payload.clientName.split(" ");
  const meetingDate = formatMeetingDate(payload.meetingAt);
  const meetingTime = formatMeetingTime(payload.meetingAt);
  const customerTemplate =
    payload.meetingType === "in_person"
      ? "consultation_scheduled_in_person"
      : "consultation_scheduled_video";

  const customerRendered = renderEmailTemplate(customerTemplate, {
    customer_first_name: firstName,
    customer_full_name: payload.clientName,
    event_type: payload.eventType,
    event_date: payload.eventDate || "To be confirmed",
    meeting_date: meetingDate,
    meeting_time: meetingTime,
    meeting_type: humanizeMeetingType(payload.meetingType),
    meeting_location: payload.meetingLocation || "To be confirmed",
    video_link: payload.videoLink || "",
  });

  await sendRenderedEmail(
    payload.clientEmail,
    customerRendered.subject,
    customerRendered.html,
    customerRendered.text
  );

  if (process.env.NOTIFICATION_TO_EMAIL) {
    const adminRendered = renderEmailTemplate("admin_meeting_notification", {
      customer_first_name: firstName,
      customer_full_name: payload.clientName,
      event_type: payload.eventType,
      event_date: payload.eventDate || "—",
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_type: humanizeMeetingType(payload.meetingType),
      meeting_location: payload.meetingLocation || "—",
      video_link: payload.videoLink || "Will be sent later",
      customer_email: payload.clientEmail,
      customer_phone: payload.clientPhone || "—",
    });

    await sendRenderedEmail(
      process.env.NOTIFICATION_TO_EMAIL,
      adminRendered.subject,
      adminRendered.html,
      adminRendered.text
    );
  }
}

export async function sendVideoLinkReminderEmail(payload: VideoReminderPayload) {
  const [firstName] = payload.clientName.split(" ");
  const rendered = renderEmailTemplate("video_link_reminder", {
    customer_first_name: firstName,
    customer_full_name: payload.clientName,
    meeting_date: formatMeetingDate(payload.meetingAt),
    meeting_time: formatMeetingTime(payload.meetingAt),
    video_link: payload.videoLink,
  });

  await sendRenderedEmail(
    payload.clientEmail,
    rendered.subject,
    rendered.html,
    rendered.text
  );
}
