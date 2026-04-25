type QuoteEmailSentInput = {
  quoteAmount: number;
  lineItemCount: number;
  clientEmail: string;
};

type ContractSentInput = {
  mode: "docusign" | "manual";
  clientEmail: string;
  envelopeId?: string | null;
  envelopeStatus?: string | null;
};

type EventInquiryCreatedInput = {
  clientId: string;
  eventType: string | null;
  estimatedPrice: number | null;
  requestedVendorCategories: unknown;
  selectedDecorCategories: unknown;
  consultationRequestDate: string | null;
  consultationRequestTime: string | null;
};

type RentalRequestCreatedInput = {
  clientId: string;
  items: Array<{
    item_name: string;
    quantity: number;
    line_subtotal: number;
  }>;
  estimatedTotal: number;
  refundableSecurityDeposit: number;
};

type InboundReplyLoggedInput = {
  fromEmail: string;
  subject?: string | null;
  threadId?: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[] | null;
  provider?: string | null;
  bodyText: string;
};

export function buildQuoteEmailSentActivityEvent(input: QuoteEmailSentInput) {
  return {
    action: "inquiry.quote_sent" as const,
    summary: "Quote email sent to client",
    metadata: {
      quote_amount: input.quoteAmount,
      line_item_count: input.lineItemCount,
      client_email: input.clientEmail,
    },
  };
}

export function buildContractSentActivityEvent(input: ContractSentInput) {
  if (input.mode === "docusign") {
    return {
      action: "contract.sent" as const,
      summary: "Contract sent through DocuSign",
      metadata: {
        client_email: input.clientEmail,
        envelope_id: input.envelopeId ?? null,
        envelope_status: input.envelopeStatus ?? null,
      },
    };
  }

  return {
    action: "contract.sent" as const,
    summary: "Contract email sent to client using manual signing link",
    metadata: {
      client_email: input.clientEmail,
      manual_link: true,
    },
  };
}

export function buildEventInquiryCreatedActivityEvent(
  input: EventInquiryCreatedInput
) {
  return {
    action: "inquiry.created" as const,
    summary: "Quote request submitted from website",
    metadata: {
      client_id: input.clientId,
      event_type: input.eventType,
      estimated_price: input.estimatedPrice,
      requested_vendor_categories: input.requestedVendorCategories,
      selected_decor_categories: input.selectedDecorCategories,
      consultation_request_date: input.consultationRequestDate,
      consultation_request_time: input.consultationRequestTime,
    },
  };
}

export function buildRentalRequestCreatedActivityEvent(
  input: RentalRequestCreatedInput
) {
  return {
    action: "rental_request.created" as const,
    summary: "Rental quote request submitted from website",
    metadata: {
      client_id: input.clientId,
      items: input.items,
      estimated_total: input.estimatedTotal,
      refundable_security_deposit: input.refundableSecurityDeposit,
    },
  };
}

export function buildInboundReplyActivityEvent(input: InboundReplyLoggedInput) {
  return {
    action: "inquiry.reply_received" as const,
    summary: input.subject?.trim()
      ? `Lead replied: ${input.subject.trim()}`
      : "Lead replied by email",
    metadata: {
      client_email: input.fromEmail,
      thread_id: input.threadId ?? null,
      message_id: input.messageId ?? null,
      in_reply_to: input.inReplyTo ?? null,
      references: input.references ?? [],
      provider: input.provider ?? null,
      body_preview: input.bodyText.slice(0, 240),
    },
  };
}
