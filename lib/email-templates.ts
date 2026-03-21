export type EmailTemplateKey =
  | "request_submitted"
  | "consultation_scheduled_video"
  | "consultation_scheduled_in_person"
  | "video_link_reminder"
  | "admin_meeting_notification"
  | "final_payment_reminder"
  | "payment_received"
  | "deposit_receipt";

export type EmailTemplateVariables = Record<string, string | number | null | undefined>;

type EmailTemplateDefinition = {
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateDefinition> = {
  request_submitted: {
    subject: "We’ve received your request – {{business_name}}",
    body: `Hi {{customer_first_name}},

Thank you for reaching out to {{business_name}}.

We’ve received your event request successfully and our team is currently reviewing the details.

You can expect to hear back from us within {{response_window}} with the next steps for your consultation.

We’re excited to learn more about your event and help bring your vision to life.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  consultation_scheduled_video: {
    subject: "Your consultation has been scheduled – {{business_name}}",
    body: `Hi {{customer_first_name}},

We’re happy to let you know that your consultation has been scheduled.

Date: {{meeting_date}}
Time: {{meeting_time}}

This consultation will take place via video call.

A meeting link will be sent to you approximately 30 minutes before the scheduled time.

During this session, we’ll go through your event details, design direction, and next steps.

We look forward to speaking with you.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  consultation_scheduled_in_person: {
    subject: "Your consultation has been scheduled – {{business_name}}",
    body: `Hi {{customer_first_name}},

We’re happy to let you know that your consultation has been scheduled.

Date: {{meeting_date}}
Time: {{meeting_time}}
Location: {{meeting_location}}

This will be an in-person meeting where we will review your event details, design direction, and planning needs.

If you have any inspiration images or ideas, feel free to bring them along.

We look forward to meeting you.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  video_link_reminder: {
    subject: "Your consultation starts soon – Join here",
    body: `Hi {{customer_first_name}},

Your consultation is coming up shortly.

Date: {{meeting_date}}
Time: {{meeting_time}}

You can join your session using the link below:

{{video_link}}

We look forward to speaking with you.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  admin_meeting_notification: {
    subject: "New consultation scheduled – {{customer_full_name}}",
    body: `A new consultation has been scheduled.

Customer Name: {{customer_full_name}}
Customer Email: {{customer_email}}
Customer Phone: {{customer_phone}}
Event Type: {{event_type}}
Event Date: {{event_date}}

Consultation Details:
Date: {{meeting_date}}
Time: {{meeting_time}}
Type: {{meeting_type}}

Location: {{meeting_location}}
Video Link: {{video_link}}

Please review and prepare accordingly.`,
  },
  final_payment_reminder: {
    subject: "Reminder: Upcoming event payment – {{business_name}}",
    body: `Hi {{customer_first_name}},

We’re looking forward to your upcoming event.

This is a friendly reminder to complete your remaining balance before the event date.

Event: {{event_type}}
Event Date: {{event_date}}
Remaining Balance: {{balance_due}}
Due Date: {{balance_due_date}}

If you have any questions or need assistance, feel free to reply to this email.

Thank you again for trusting {{business_name}}.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  payment_received: {
    subject: "Payment received – Thank you",
    body: `Hi {{customer_first_name}},

We’ve received your payment successfully.

Event: {{event_type}}
Event Date: {{event_date}}
Payment Received: {{payment_amount}}

Thank you for completing your payment. Your event is now fully confirmed.

We’re excited to bring your vision to life and will follow up if any final details are needed.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
  deposit_receipt: {
    subject: "Payment received – Thank you",
    body: `Hi {{customer_first_name}},

We’ve received your payment successfully.

Event: {{event_type}}
Event Date: {{event_date}}
Deposit Received: {{payment_amount}}

Thank you for completing your payment. Your date is now moving forward in our reserved planning workflow.

We’re excited to bring your vision to life and will follow up if any final details are needed.

Warm regards,
{{business_name}}

{{business_email}}
{{business_phone}}
{{website_url}}`,
  },
};
