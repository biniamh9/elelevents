import { Resend } from "resend";
import {
  buildAdminMeetingNotificationEmailVariables,
  buildConsultationScheduledCustomerEmailVariables,
  buildInquiryConfirmationEmailVariables,
  buildVideoLinkReminderEmailVariables,
} from "@/lib/email-template-variables";
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

function buildCalendarLink(payload: {
  title: string;
  description: string;
  location?: string | null;
  start: string;
}) {
  try {
    const start = new Date(payload.start);
    if (Number.isNaN(start.getTime())) {
      return "";
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const format = (date: Date) =>
      date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", payload.title);
    url.searchParams.set("dates", `${format(start)}/${format(end)}`);
    url.searchParams.set("details", payload.description);
    if (payload.location) {
      url.searchParams.set("location", payload.location);
    }
    return url.toString();
  } catch {
    return "";
  }
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
  const rendered = renderEmailTemplate(
    "request_submitted",
    buildInquiryConfirmationEmailVariables({
      clientName: payload.clientName,
      eventType: payload.eventType,
      eventDate: payload.eventDate,
      responseWindow: "12–24 hours",
    })
  );

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
  const meetingDate = formatMeetingDate(payload.meetingAt);
  const meetingTime = formatMeetingTime(payload.meetingAt);
  const customerTemplate =
    payload.meetingType === "in_person"
      ? "consultation_scheduled_in_person"
      : "consultation_scheduled_video";

  const customerRendered = renderEmailTemplate(
    customerTemplate,
    buildConsultationScheduledCustomerEmailVariables({
      clientName: payload.clientName,
      eventType: payload.eventType,
      eventDate: payload.eventDate,
      meetingDate,
      meetingTime,
      meetingType: humanizeMeetingType(payload.meetingType),
      meetingLocation: payload.meetingLocation,
      videoLink: payload.videoLink,
      calendarLink: buildCalendarLink({
        title: `${payload.eventType} consultation with Elel Events`,
        description:
          payload.meetingType === "in_person"
            ? "In-person design consultation with Elel Events & Design."
            : "Video design consultation with Elel Events & Design.",
        location:
          payload.meetingType === "in_person"
            ? payload.meetingLocation || "To be confirmed"
            : payload.videoLink || "Meeting link will be shared before the call.",
        start: payload.meetingAt,
      }),
    })
  );

  await sendRenderedEmail(
    payload.clientEmail,
    customerRendered.subject,
    customerRendered.html,
    customerRendered.text
  );

  if (process.env.NOTIFICATION_TO_EMAIL) {
    const adminRendered = renderEmailTemplate(
      "admin_meeting_notification",
      buildAdminMeetingNotificationEmailVariables({
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        clientPhone: payload.clientPhone,
        eventType: payload.eventType,
        eventDate: payload.eventDate,
        meetingDate,
        meetingTime,
        meetingType: humanizeMeetingType(payload.meetingType),
        meetingLocation: payload.meetingLocation,
        videoLink: payload.videoLink,
      })
    );

    await sendRenderedEmail(
      process.env.NOTIFICATION_TO_EMAIL,
      adminRendered.subject,
      adminRendered.html,
      adminRendered.text
    );
  }
}

export async function sendVideoLinkReminderEmail(payload: VideoReminderPayload) {
  const rendered = renderEmailTemplate(
    "video_link_reminder",
    buildVideoLinkReminderEmailVariables({
      clientName: payload.clientName,
      meetingDate: formatMeetingDate(payload.meetingAt),
      meetingTime: formatMeetingTime(payload.meetingAt),
      videoLink: payload.videoLink,
    })
  );

  await sendRenderedEmail(
    payload.clientEmail,
    rendered.subject,
    rendered.html,
    rendered.text
  );
}
