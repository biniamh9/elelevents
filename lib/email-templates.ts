import { getAdminOperationalEmailGuidance } from "@/lib/admin-operational-email";

export type EmailTemplateKey =
  | "request_submitted"
  | "admin_event_request"
  | "admin_event_inquiry"
  | "admin_rental_request"
  | "quote_proposal"
  | "contract_ready"
  | "consultation_scheduled_video"
  | "consultation_scheduled_in_person"
  | "video_link_reminder"
  | "admin_meeting_notification"
  | "final_payment_reminder"
  | "payment_received"
  | "deposit_receipt";

export type EmailTemplateVariables = Record<string, string | number | null | undefined>;

const adminEventRequestGuidance = getAdminOperationalEmailGuidance("event_request");
const adminEventInquiryGuidance = getAdminOperationalEmailGuidance("event_inquiry");
const adminConsultationGuidance = getAdminOperationalEmailGuidance("consultation");
const adminRentalRequestGuidance = getAdminOperationalEmailGuidance("rental_request");

type EmailTemplateSummaryRow = {
  label: string;
  value: string;
};

type EmailTemplateAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type EmailTemplateSection = {
  title: string;
  content?: string;
  html?: string;
  rows?: EmailTemplateSummaryRow[];
  action?: EmailTemplateAction;
  actions?: EmailTemplateAction[];
};

type EmailTemplateDefinition = {
  eyebrow?: string;
  subject: string;
  intro?: string;
  body: string;
  summaryTitle?: string;
  summaryRows?: EmailTemplateSummaryRow[];
  secondarySections?: EmailTemplateSection[];
  action?: EmailTemplateAction;
  actions?: EmailTemplateAction[];
  footerNote?: string;
};

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateDefinition> = {
  request_submitted: {
    eyebrow: "Request Received",
    subject: "We’ve received your request – {{business_name}}",
    intro:
      "Thank you for reaching out. Your event request is now in review and our team will follow up with your next planning steps shortly.",
    body: `Hi {{customer_first_name}},

Thank you for reaching out to {{business_name}}.

We’ve received your event request successfully and our team is currently reviewing the details.

You can expect to hear back from us within {{response_window}} with the next steps for your consultation.

We’re excited to learn more about your event and help bring your vision to life.

Warm regards,
{{business_name}}
`,
    summaryTitle: "Request overview",
    summaryRows: [
      { label: "Event type", value: "{{event_type}}" },
      { label: "Event date", value: "{{event_date}}" },
      { label: "Response window", value: "{{response_window}}" },
    ],
    secondarySections: [
      {
        title: "Next steps",
        content:
          "Our team will review your request, confirm the design direction, and reach out with the next consultation steps within {{response_window}}.",
      },
    ],
    footerNote:
      "Reply to this email if you need to add venue details, guest count updates, or visual inspiration before consultation.",
  },
  admin_event_request: {
    eyebrow: "New Event Request",
    subject: "New Event Request",
    intro:
      "A new lead came in through the Elel Events request form and is ready for review.",
    body: `A new event request has been submitted.`,
    summaryTitle: "Lead details",
    summaryRows: [
      { label: "Name", value: "{{lead_name}}" },
      { label: "Email", value: "{{lead_email}}" },
      { label: "Phone", value: "{{lead_phone}}" },
      { label: "Event date", value: "{{event_date}}" },
      { label: "Guest count", value: "{{guest_count}}" },
    ],
    secondarySections: [
      {
        title: "Notes",
        html: "{{notes_html}}",
      },
      {
        title: adminEventRequestGuidance.nextStepsTitle,
        content: adminEventRequestGuidance.nextStepsContent,
      },
    ],
    footerNote: adminEventRequestGuidance.footerNote,
  },
  admin_event_inquiry: {
    eyebrow: "New Inquiry Submitted",
    subject: "New Event Inquiry: {{event_type}} - {{customer_full_name}}",
    intro:
      "A new event request is ready for review in the Elel Events admin workspace.",
    body: `{{customer_full_name}} submitted a new event inquiry.`,
    summaryTitle: "Client details",
    summaryRows: [
      { label: "Name", value: "{{customer_full_name}}" },
      { label: "Email", value: "{{customer_email}}" },
      { label: "Phone", value: "{{customer_phone}}" },
    ],
    secondarySections: [
      {
        title: "Event summary",
        rows: [
          { label: "Event type", value: "{{event_type}}" },
          { label: "Event date", value: "{{event_date}}" },
          { label: "Guest count", value: "{{guest_count}}" },
          { label: "Venue", value: "{{venue_name}}" },
          { label: "Estimated value", value: "{{estimated_value}}" },
        ],
      },
      {
        title: adminEventInquiryGuidance.nextStepsTitle,
        content: adminEventInquiryGuidance.nextStepsContent,
      },
    ],
    footerNote: adminEventInquiryGuidance.footerNote,
  },
  admin_rental_request: {
    eyebrow: "New Rental Request",
    subject: "New Rental Quote Request: {{customer_full_name}}",
    intro:
      "A rental-specific request is ready for review in the rental pipeline.",
    body: `{{customer_full_name}} requested a rental quote.`,
    summaryTitle: "Client details",
    summaryRows: [
      { label: "Name", value: "{{customer_full_name}}" },
      { label: "Email", value: "{{customer_email}}" },
      { label: "Phone", value: "{{customer_phone}}" },
    ],
    secondarySections: [
      {
        title: "Rental items",
        html: "{{rental_items_html}}",
      },
      {
        title: "Pricing summary",
        html: "{{pricing_summary_html}}",
      },
      {
        title: adminRentalRequestGuidance.nextStepsTitle,
        content: adminRentalRequestGuidance.nextStepsContent,
      },
    ],
    footerNote: adminRentalRequestGuidance.footerNote,
  },
  quote_proposal: {
    eyebrow: "Quote / Proposal",
    subject: "Your {{event_type}} quote is ready – {{business_name}}",
    intro:
      "We prepared a proposal aligned with the event direction discussed together. Review the scope below and let us know if any refinements are needed.",
    body: `Hello {{customer_first_name}},

{{quote_message}}
`,
    summaryTitle: "Proposal summary",
    summaryRows: [
      { label: "Event", value: "{{event_type}}" },
      { label: "Date", value: "{{event_date}}" },
      { label: "Venue", value: "{{venue_name}}" },
    ],
    secondarySections: [
      {
        title: "Itemized scope",
        html: "{{itemized_scope_html}}",
      },
      {
        title: "Pricing totals",
        rows: [
          { label: "Base design fee", value: "{{base_design_fee}}" },
          { label: "Decor line items", value: "{{decor_line_items}}" },
          { label: "Delivery / setup", value: "{{delivery_setup_total}}" },
          { label: "Labor adjustment", value: "{{labor_adjustment_total}}" },
          { label: "Discount", value: "{{discount_total}}" },
          { label: "Tax", value: "{{tax_total}}" },
          { label: "Total proposal", value: "{{quote_total}}" },
        ],
      },
      {
        title: "What happens next",
        content:
          "Reply to this email if you would like refinements, removals, substitutions, or a more detailed revision. Once you confirm the direction, we prepare the agreement and booking steps.",
      },
      {
        title: "Proposal notes",
        content: "{{quote_disclaimer}}",
      },
    ],
    actions: [
      {
        label: "Approve Quote",
        href: "{{approve_url}}",
        variant: "primary",
      },
      {
        label: "Request Changes",
        href: "{{changes_url}}",
        variant: "secondary",
      },
    ],
    footerNote:
      "Your event date is secured once the proposal is approved, the agreement is signed, and the deposit is received.",
  },
  contract_ready: {
    eyebrow: "Contract Ready",
    subject: "Your Event Contract – {{business_name}}",
    intro:
      "Your agreement is ready for review. Once signed, we can confirm the booking status and share the next payment and production steps.",
    body: `Hello {{customer_first_name}},

Thank you for choosing {{business_name}} for your celebration.
`,
    summaryTitle: "Agreement summary",
    summaryRows: [
      { label: "Event", value: "{{event_type}}" },
      { label: "Date", value: "{{event_date}}" },
      { label: "Venue", value: "{{venue_name}}" },
      { label: "Contract total", value: "{{contract_total}}" },
      { label: "Deposit", value: "{{deposit_amount}}" },
      { label: "Balance due", value: "{{balance_due}}" },
    ],
    secondarySections: [
      {
        title: "Next steps",
        content:
          "Review and sign the agreement using the secure link below. After signing, we will confirm the booking status and move into payment and production planning.",
      },
      {
        title: "Need clarification?",
        content:
          "If you need any clarification before signing, reply directly to this message and our team will assist you.",
      },
    ],
    action: {
      label: "Review & Sign Contract",
      href: "{{contract_url}}",
      variant: "primary",
    },
    footerNote:
      "Signing the agreement and completing the deposit are the final steps to secure your date in our calendar.",
  },
  consultation_scheduled_video: {
    eyebrow: "Consultation Scheduled",
    subject: "Your consultation has been scheduled – {{business_name}}",
    intro:
      "Your design consultation is confirmed. We’ve reserved time to review your event direction, priorities, and next planning steps together.",
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
`,
    summaryTitle: "Consultation details",
    summaryRows: [
      { label: "Date", value: "{{meeting_date}}" },
      { label: "Time", value: "{{meeting_time}}" },
      { label: "Format", value: "{{meeting_type}}" },
    ],
    action: {
      label: "Add to Calendar",
      href: "{{calendar_link}}",
      variant: "secondary",
    },
    secondarySections: [
      {
        title: "What to prepare",
        content:
          "Bring or send any inspiration images, venue notes, must-have decor priorities, and guest-count updates you want us to review during consultation.",
      },
      {
        title: "Next steps after the meeting",
        content:
          "After consultation, we refine the design scope, shape the quote, and outline the booking steps needed to secure your date.",
      },
    ],
    footerNote:
      "If you need to update your consultation timing, reply directly to this email and our team will assist you.",
  },
  consultation_scheduled_in_person: {
    eyebrow: "Consultation Scheduled",
    subject: "Your consultation has been scheduled – {{business_name}}",
    intro:
      "Your in-person consultation is confirmed. We’ll use this meeting to review your event direction, venue needs, and styling scope in detail.",
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
`,
    summaryTitle: "Consultation details",
    summaryRows: [
      { label: "Date", value: "{{meeting_date}}" },
      { label: "Time", value: "{{meeting_time}}" },
      { label: "Location", value: "{{meeting_location}}" },
    ],
    action: {
      label: "Add to Calendar",
      href: "{{calendar_link}}",
      variant: "secondary",
    },
    secondarySections: [
      {
        title: "What to prepare",
        content:
          "Bring any inspiration images, room references, focal-area priorities, and planning questions that will help us shape the event direction clearly.",
      },
      {
        title: "Next steps after the meeting",
        content:
          "After consultation, we refine the design scope, shape the quote, and outline the booking steps needed to secure your date.",
      },
    ],
    footerNote:
      "Bring any inspiration images, floral references, or room details you’d like us to review together.",
  },
  video_link_reminder: {
    eyebrow: "Consultation Reminder",
    subject: "Your consultation starts soon – Join here",
    intro:
      "Your consultation is coming up shortly. Use the secure link below to join at the scheduled time.",
    body: `Hi {{customer_first_name}},

Your consultation is coming up shortly.

Date: {{meeting_date}}
Time: {{meeting_time}}

You can join your session using the link below:

{{video_link}}

We look forward to speaking with you.

Warm regards,
{{business_name}}
`,
    summaryTitle: "Meeting reminder",
    summaryRows: [
      { label: "Date", value: "{{meeting_date}}" },
      { label: "Time", value: "{{meeting_time}}" },
    ],
    action: {
      label: "Join Consultation",
      href: "{{video_link}}",
      variant: "primary",
    },
    secondarySections: [
      {
        title: "Before you join",
        content:
          "Have your inspiration references, event priorities, venue notes, and any questions ready so we can use the meeting time efficiently.",
      },
    ],
    footerNote:
      "If the link does not open correctly, reply to this email and we will send a replacement immediately.",
  },
  admin_meeting_notification: {
    eyebrow: "Admin Notice",
    subject: "New consultation scheduled – {{customer_full_name}}",
    intro: "A new consultation has been added and is ready for internal review.",
    body: `{{customer_full_name}} scheduled a new consultation that is ready for internal review.`,
    summaryTitle: "Client details",
    summaryRows: [
      { label: "Customer", value: "{{customer_full_name}}" },
      { label: "Email", value: "{{customer_email}}" },
      { label: "Phone", value: "{{customer_phone}}" },
    ],
    secondarySections: [
      {
        title: "Consultation details",
        rows: [
          { label: "Event type", value: "{{event_type}}" },
          { label: "Event date", value: "{{event_date}}" },
          { label: "Meeting date", value: "{{meeting_date}}" },
          { label: "Meeting time", value: "{{meeting_time}}" },
          { label: "Format", value: "{{meeting_type}}" },
          { label: "Location", value: "{{meeting_location}}" },
          { label: "Video link", value: "{{video_link}}" },
        ],
      },
      {
        title: adminConsultationGuidance.nextStepsTitle,
        content: adminConsultationGuidance.nextStepsContent,
      },
    ],
    footerNote: adminConsultationGuidance.footerNote,
  },
  final_payment_reminder: {
    eyebrow: "Payment Reminder",
    subject: "Reminder: Upcoming event payment – {{business_name}}",
    intro:
      "This is a reminder that your remaining balance is approaching its due date so production and event scheduling stay on track.",
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
`,
    summaryTitle: "Balance due",
    summaryRows: [
      { label: "Event", value: "{{event_type}}" },
      { label: "Event date", value: "{{event_date}}" },
      { label: "Remaining balance", value: "{{balance_due}}" },
      { label: "Due date", value: "{{balance_due_date}}" },
    ],
    secondarySections: [
      {
        title: "Payment instructions",
        content:
          "{{payment_instructions}}",
      },
      {
        title: "What happens after payment",
        content:
          "Once the balance is received, your event file remains clear for production scheduling, final confirmations, and event-week logistics.",
      },
    ],
    footerNote:
      "Reply to this message if you need billing clarification or would like us to confirm the remaining payment steps.",
  },
  payment_received: {
    eyebrow: "Payment Received",
    subject: "Payment received – Thank you",
    intro:
      "We’ve received your payment successfully. Your event record has been updated and planning will continue on schedule.",
    body: `Hi {{customer_first_name}},

We’ve received your payment successfully.

Event: {{event_type}}
Event Date: {{event_date}}
Payment Received: {{payment_amount}}

Thank you for completing your payment. Your event is now fully confirmed.

We’re excited to bring your vision to life and will follow up if any final details are needed.

Warm regards,
{{business_name}}
`,
    summaryTitle: "Payment confirmation",
    summaryRows: [
      { label: "Event", value: "{{event_type}}" },
      { label: "Event date", value: "{{event_date}}" },
      { label: "Payment received", value: "{{payment_amount}}" },
    ],
    secondarySections: [
      {
        title: "Next steps",
        content:
          "Your payment has been logged successfully. We will continue planning, production coordination, and final event preparation on schedule.",
      },
    ],
    footerNote:
      "Keep this email for your records and reply if you need any updated payment documentation from our team.",
  },
  deposit_receipt: {
    eyebrow: "Deposit Received",
    subject: "Payment received – Thank you",
    intro:
      "We’ve received your deposit successfully. Your date is now moving forward through our reserved planning workflow.",
    body: `Hi {{customer_first_name}},

We’ve received your payment successfully.

Event: {{event_type}}
Event Date: {{event_date}}
Deposit Received: {{payment_amount}}

Thank you for completing your payment. Your date is now moving forward in our reserved planning workflow.

We’re excited to bring your vision to life and will follow up if any final details are needed.

Warm regards,
{{business_name}}
`,
    summaryTitle: "Deposit confirmation",
    summaryRows: [
      { label: "Event", value: "{{event_type}}" },
      { label: "Event date", value: "{{event_date}}" },
      { label: "Deposit received", value: "{{payment_amount}}" },
    ],
    secondarySections: [
      {
        title: "Next steps",
        content:
          "Your deposit has been logged and your event is moving forward in our reserved planning workflow. We will continue with scope refinement, scheduling, and production preparation.",
      },
    ],
    footerNote:
      "Your booking continues moving forward from here. We’ll reach out if any planning or production detail needs your review.",
  },
};
