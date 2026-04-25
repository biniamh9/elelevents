export function extractEmailAddress(fromEmail: string) {
  return fromEmail.includes("<")
    ? fromEmail.match(/<([^>]+)>/)?.[1] ?? fromEmail
    : fromEmail;
}

type QuoteEmailMetadataInput = {
  quoteAmount: number;
  approveUrl: string;
  changesUrl: string;
  lineItemCount: number;
  clientEmail: string;
};

export function buildQuoteEmailInteractionMetadata(
  input: Pick<QuoteEmailMetadataInput, "quoteAmount" | "approveUrl" | "changesUrl">
) {
  return {
    type: "quote_email",
    quote_amount: input.quoteAmount,
    approve_url: input.approveUrl,
    changes_url: input.changesUrl,
  };
}

export function buildQuoteEmailActivityMetadata(
  input: Pick<QuoteEmailMetadataInput, "quoteAmount" | "lineItemCount" | "clientEmail">
) {
  return {
    quote_amount: input.quoteAmount,
    line_item_count: input.lineItemCount,
    client_email: input.clientEmail,
  };
}

export function buildQuoteEmailWorkflowMetadata(
  input: Pick<QuoteEmailMetadataInput, "quoteAmount" | "lineItemCount">
) {
  return {
    quote_amount: input.quoteAmount,
    line_item_count: input.lineItemCount,
  };
}

type ContractDeliveryMode = "docusign" | "manual";

type ContractDeliveryMetadataInput = {
  mode: ContractDeliveryMode;
  clientEmail: string;
  envelopeId?: string | null;
  envelopeStatus?: string | null;
};

export function buildContractDeliveryActivityMetadata(
  input: ContractDeliveryMetadataInput
) {
  if (input.mode === "docusign") {
    return {
      client_email: input.clientEmail,
      envelope_id: input.envelopeId ?? null,
      envelope_status: input.envelopeStatus ?? null,
    };
  }

  return {
    client_email: input.clientEmail,
    manual_link: true,
  };
}

export function buildContractDeliveryWorkflowMetadata(mode: ContractDeliveryMode) {
  return {
    delivery_mode: mode,
  };
}
