import type { EmailTemplateVariables } from "@/lib/email-templates";

type QuoteProposalVariablesInput = {
  customerFirstName: string;
  eventType: string;
  eventDate: string | null;
  venueName?: string | null;
  quoteMessage: string;
  itemizedScopeHtml: string;
  baseDesignFee: number;
  decorLineItems: number;
  deliverySetupTotal: number;
  laborAdjustmentTotal: number;
  discountTotal: number;
  taxTotal: number;
  quoteTotal: number;
  approveUrl: string;
  changesUrl: string;
  quoteDisclaimer: string;
};

type ContractReadyVariablesInput = {
  clientName: string;
  eventType?: string | null;
  eventDate?: string | null;
  venueName?: string | null;
  contractTotal: number | null | undefined;
  depositAmount: number | null | undefined;
  balanceDue: number | null | undefined;
  contractUrl: string;
};

type AdminEventRequestVariablesInput = {
  name: string;
  email: string;
  phone: string;
  eventDate?: string | null;
  guestCount: string;
  notesHtml: string;
};

type AdminEventInquiryVariablesInput = {
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate?: string | null;
  guestCount: string;
  venueName?: string | null;
  estimatedValue: number;
};

type AdminRentalRequestVariablesInput = {
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  rentalItemsHtml: string;
  pricingSummaryHtml: string;
};

type InquiryConfirmationVariablesInput = {
  clientName: string;
  eventType: string;
  eventDate?: string | null;
  responseWindow?: string;
};

type ConsultationScheduledVariablesInput = {
  clientName: string;
  eventType: string;
  eventDate?: string | null;
  meetingDate: string;
  meetingTime: string;
  meetingType: string;
  meetingLocation?: string | null;
  videoLink?: string | null;
  calendarLink: string;
};

type AdminMeetingNotificationVariablesInput = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  eventType: string;
  eventDate?: string | null;
  meetingDate: string;
  meetingTime: string;
  meetingType: string;
  meetingLocation?: string | null;
  videoLink?: string | null;
};

type VideoLinkReminderVariablesInput = {
  clientName: string;
  meetingDate: string;
  meetingTime: string;
  videoLink: string;
};

function formatCurrency(value: number | null | undefined, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(Number(value ?? 0));
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) {
    return "To be confirmed";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function firstNameFromFullName(name: string) {
  return name.split(/\s+/)[0] || name;
}

export function buildQuoteProposalEmailVariables(
  input: QuoteProposalVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: input.customerFirstName,
    event_type: input.eventType,
    event_date: formatDisplayDate(input.eventDate),
    venue_name: input.venueName || "",
    quote_message: input.quoteMessage,
    itemized_scope_html: input.itemizedScopeHtml,
    base_design_fee: formatCurrency(input.baseDesignFee),
    decor_line_items: formatCurrency(input.decorLineItems),
    delivery_setup_total:
      input.deliverySetupTotal > 0 ? formatCurrency(input.deliverySetupTotal) : "",
    labor_adjustment_total:
      input.laborAdjustmentTotal !== 0 ? formatCurrency(input.laborAdjustmentTotal) : "",
    discount_total: input.discountTotal > 0 ? formatCurrency(-input.discountTotal) : "",
    tax_total: input.taxTotal > 0 ? formatCurrency(input.taxTotal) : "",
    quote_total: formatCurrency(input.quoteTotal),
    approve_url: input.approveUrl,
    changes_url: input.changesUrl,
    quote_disclaimer: input.quoteDisclaimer,
  };
}

export function buildContractReadyEmailVariables(
  input: ContractReadyVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: firstNameFromFullName(input.clientName),
    event_type: input.eventType || "Your event",
    event_date: input.eventDate || "To be confirmed",
    venue_name: input.venueName || "",
    contract_total: formatCurrency(input.contractTotal, 2),
    deposit_amount: formatCurrency(input.depositAmount, 2),
    balance_due: formatCurrency(input.balanceDue, 2),
    contract_url: input.contractUrl,
  };
}

export function buildAdminEventRequestEmailVariables(
  input: AdminEventRequestVariablesInput
): EmailTemplateVariables {
  return {
    lead_name: input.name,
    lead_email: input.email,
    lead_phone: input.phone,
    event_date: input.eventDate || "N/A",
    guest_count: input.guestCount,
    notes_html: input.notesHtml,
  };
}

export function buildAdminEventInquiryEmailVariables(
  input: AdminEventInquiryVariablesInput
): EmailTemplateVariables {
  return {
    customer_full_name: input.customerFullName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    event_type: input.eventType,
    event_date: input.eventDate || "N/A",
    guest_count: input.guestCount,
    venue_name: input.venueName || "N/A",
    estimated_value: `$${input.estimatedValue.toLocaleString()}`,
  };
}

export function buildAdminRentalRequestEmailVariables(
  input: AdminRentalRequestVariablesInput
): EmailTemplateVariables {
  return {
    customer_full_name: input.customerFullName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    rental_items_html: input.rentalItemsHtml,
    pricing_summary_html: input.pricingSummaryHtml,
  };
}

export function buildInquiryConfirmationEmailVariables(
  input: InquiryConfirmationVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: firstNameFromFullName(input.clientName),
    customer_full_name: input.clientName,
    event_type: input.eventType,
    event_date: input.eventDate || "To be confirmed",
    response_window: input.responseWindow || "12–24 hours",
  };
}

export function buildConsultationScheduledCustomerEmailVariables(
  input: ConsultationScheduledVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: firstNameFromFullName(input.clientName),
    customer_full_name: input.clientName,
    event_type: input.eventType,
    event_date: input.eventDate || "To be confirmed",
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    meeting_type: input.meetingType,
    meeting_location: input.meetingLocation || "To be confirmed",
    video_link: input.videoLink || "",
    calendar_link: input.calendarLink,
  };
}

export function buildAdminMeetingNotificationEmailVariables(
  input: AdminMeetingNotificationVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: firstNameFromFullName(input.clientName),
    customer_full_name: input.clientName,
    event_type: input.eventType,
    event_date: input.eventDate || "—",
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    meeting_type: input.meetingType,
    meeting_location: input.meetingLocation || "—",
    video_link: input.videoLink || "Will be sent later",
    customer_email: input.clientEmail,
    customer_phone: input.clientPhone || "—",
  };
}

export function buildVideoLinkReminderEmailVariables(
  input: VideoLinkReminderVariablesInput
): EmailTemplateVariables {
  return {
    customer_first_name: firstNameFromFullName(input.clientName),
    customer_full_name: input.clientName,
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    video_link: input.videoLink,
  };
}

export { formatDisplayDate as formatEmailDisplayDate };
