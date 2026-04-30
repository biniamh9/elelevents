import {
  DEFAULT_BASE_FEE,
  type InquiryQuoteLineItem,
  type InquiryQuotePricing,
  calculateQuoteTotals,
} from "@/lib/admin-pricing";

export type ClientDocumentType = "quote" | "invoice" | "receipt";

export type ClientDocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "expired"
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue";

export type ClientDocumentLineItem = {
  id: string;
  document_id?: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  display_order: number;
};

export type ClientDocumentPayment = {
  id: string;
  document_id: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at?: string | null;
};

export type ClientDocumentRecord = {
  id: string;
  inquiry_id: string | null;
  contract_id: string | null;
  document_type: ClientDocumentType;
  document_number: string;
  status: ClientDocumentStatus;
  issue_date: string | null;
  due_date: string | null;
  expiration_date: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  event_type: string | null;
  event_date: string | null;
  guest_count?: number | null;
  venue_name: string | null;
  venue_address: string | null;
  notes: string | null;
  inclusions: string | null;
  exclusions: string | null;
  payment_instructions: string | null;
  payment_terms: string | null;
  subtotal: number;
  delivery_fee: number;
  setup_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  deposit_required: number;
  amount_paid: number;
  balance_due: number;
  related_quote_id: string | null;
  related_invoice_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientDocumentWithRelations = ClientDocumentRecord & {
  line_items: ClientDocumentLineItem[];
  payments: ClientDocumentPayment[];
};

export type DocumentSeedContext = {
  inquiry?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    event_type: string | null;
    event_date: string | null;
    guest_count?: number | null;
    venue_name: string | null;
    venue_address: string | null;
  } | null;
  contract?: {
    id: string;
    client_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    event_type: string | null;
    event_date: string | null;
    guest_count?: number | null;
    venue_name: string | null;
    venue_address: string | null;
    contract_total: number | null;
    deposit_amount: number | null;
    balance_due: number | null;
    balance_due_date: string | null;
    deposit_paid: boolean | null;
  } | null;
  pricing?: InquiryQuotePricing | null;
  quoteLineItems?: InquiryQuoteLineItem[];
  sourceDocument?: ClientDocumentWithRelations | null;
};

export const documentTypeLabels: Record<ClientDocumentType, string> = {
  quote: "Quote / Proposal",
  invoice: "Invoice",
  receipt: "Payment Receipt",
};

export const documentStatusLabels: Record<ClientDocumentStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const documentStatusOptions: Record<ClientDocumentType, ClientDocumentStatus[]> = {
  quote: ["draft", "sent", "accepted", "expired"],
  invoice: ["draft", "sent", "unpaid", "partially_paid", "paid", "overdue"],
  receipt: ["paid"],
};

export function formatMoney(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDocumentDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function calculateDocumentLineTotal(
  quantity: number | null | undefined,
  unitPrice: number | null | undefined
) {
  return Number(((quantity ?? 0) * (unitPrice ?? 0)).toFixed(2));
}

export function calculateDocumentTotals(input: {
  lineItems: ClientDocumentLineItem[];
  deliveryFee?: number | null;
  setupFee?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  amountPaid?: number | null;
  depositRequired?: number | null;
}) {
  const lineItemsSubtotal = Number(
    input.lineItems
      .reduce((sum, item) => sum + calculateDocumentLineTotal(item.quantity, item.unit_price), 0)
      .toFixed(2)
  );
  const deliveryFee = Number(input.deliveryFee ?? 0);
  const setupFee = Number(input.setupFee ?? 0);
  const discountAmount = Number(input.discountAmount ?? 0);
  const taxAmount = Number(input.taxAmount ?? 0);
  const subtotal = Number((lineItemsSubtotal + deliveryFee + setupFee - discountAmount).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));
  const amountPaid = Number(input.amountPaid ?? 0);
  const depositRequired = Number(input.depositRequired ?? 0);
  const balanceDue = Number(Math.max(totalAmount - amountPaid, 0).toFixed(2));

  return {
    lineItemsSubtotal,
    subtotal,
    totalAmount,
    deliveryFee,
    setupFee,
    discountAmount,
    taxAmount,
    depositRequired,
    amountPaid,
    balanceDue,
  };
}

export function humanizeDocumentStatus(status: string | null | undefined) {
  if (!status) {
    return "Draft";
  }

  return documentStatusLabels[status as ClientDocumentStatus] ?? status.replaceAll("_", " ");
}

export function createBlankDocument(type: ClientDocumentType): ClientDocumentWithRelations {
  const issueDate = new Date().toISOString().slice(0, 10);

  return {
    id: "",
    inquiry_id: null,
    contract_id: null,
    document_type: type,
    document_number: "",
    status: type === "receipt" ? "paid" : type === "quote" ? "draft" : "unpaid",
    issue_date: issueDate,
    due_date: type === "invoice" ? issueDate : null,
    expiration_date: type === "quote" ? issueDate : null,
    customer_name: "",
    customer_email: null,
    customer_phone: null,
    event_type: null,
    event_date: null,
    venue_name: null,
    venue_address: null,
    notes: null,
    inclusions: null,
    exclusions: null,
    payment_instructions: null,
    payment_terms: null,
    subtotal: 0,
    delivery_fee: 0,
    setup_fee: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    deposit_required: 0,
    amount_paid: 0,
    balance_due: 0,
    related_quote_id: null,
    related_invoice_id: null,
    line_items: [],
    payments: [],
  };
}

export function seedDocumentFromContext(
  type: ClientDocumentType,
  context: DocumentSeedContext
): ClientDocumentWithRelations {
  const blank = createBlankDocument(type);
  const customerName = context.contract?.client_name
    ?? [context.inquiry?.first_name, context.inquiry?.last_name].filter(Boolean).join(" ").trim()
    ?? "";
  const customerEmail = context.contract?.client_email ?? context.inquiry?.email ?? null;
  const customerPhone = context.contract?.client_phone ?? context.inquiry?.phone ?? null;
  const eventType = context.contract?.event_type ?? context.inquiry?.event_type ?? null;
  const eventDate = context.contract?.event_date ?? context.inquiry?.event_date ?? null;
  const guestCount = context.contract?.guest_count ?? context.inquiry?.guest_count ?? null;
  const venueName = context.contract?.venue_name ?? context.inquiry?.venue_name ?? null;
  const venueAddress = context.contract?.venue_address ?? context.inquiry?.venue_address ?? null;

  let lineItems: ClientDocumentLineItem[] = [];
  let deliveryFee = 0;
  let setupFee = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  let depositRequired = 0;
  let amountPaid = 0;
  let notes: string | null = null;
  let inclusions: string | null = null;
  let paymentTerms: string | null = null;
  let paymentInstructions: string | null = null;
  let relatedQuoteId: string | null = null;
  let relatedInvoiceId: string | null = null;

  if (context.sourceDocument) {
    lineItems = context.sourceDocument.line_items.map((item, index) => ({
      ...item,
      id: item.id || `seed-${index}`,
      document_id: null,
      display_order: index,
    }));
    deliveryFee = Number(context.sourceDocument.delivery_fee ?? 0);
    setupFee = Number(context.sourceDocument.setup_fee ?? 0);
    discountAmount = Number(context.sourceDocument.discount_amount ?? 0);
    taxAmount = Number(context.sourceDocument.tax_amount ?? 0);
    depositRequired = Number(context.sourceDocument.deposit_required ?? 0);
    amountPaid = Number(context.sourceDocument.amount_paid ?? 0);
    notes = context.sourceDocument.notes;
    inclusions = context.sourceDocument.inclusions;
    paymentTerms = context.sourceDocument.payment_terms;
    paymentInstructions = context.sourceDocument.payment_instructions;
    if (type === "invoice") {
      relatedQuoteId =
        context.sourceDocument.document_type === "quote"
          ? context.sourceDocument.id
          : context.sourceDocument.related_quote_id;
    }
    if (type === "receipt") {
      relatedInvoiceId =
        context.sourceDocument.document_type === "invoice"
          ? context.sourceDocument.id
          : context.sourceDocument.related_invoice_id;
    }
  } else if (context.quoteLineItems?.length || context.pricing) {
    const pricing = context.pricing;
    const quoteLineItems = context.quoteLineItems ?? [];
    lineItems = [
      {
        id: "base-fee",
        title: "Base event fee",
        description: "Core planning and design direction",
        quantity: 1,
        unit_price: Number(pricing?.base_fee ?? DEFAULT_BASE_FEE),
        total_price: Number(pricing?.base_fee ?? DEFAULT_BASE_FEE),
        display_order: 0,
      },
      ...quoteLineItems.map((item, index) => ({
        id: item.id,
        title: item.item_name,
        description: item.notes,
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        total_price: Number(item.line_total ?? item.unit_price ?? 0),
        display_order: index + 1,
      })),
    ];
    deliveryFee = Number(pricing?.delivery_fee ?? 0);
    discountAmount = Number(pricing?.discount_amount ?? 0);
    taxAmount = Number(pricing?.tax_amount ?? 0);
    notes = pricing?.notes ?? null;
    inclusions = pricing?.client_disclaimer ?? null;
  } else if (context.contract) {
    const total = Number(context.contract.contract_total ?? 0);
    lineItems = [
      {
        id: "contract-total",
        title: "Event styling package",
        description: context.contract.event_type ?? "Event scope",
        quantity: 1,
        unit_price: total,
        total_price: total,
        display_order: 0,
      },
    ];
    depositRequired = Number(context.contract.deposit_amount ?? 0);
    amountPaid = context.contract.deposit_paid
      ? Number(context.contract.deposit_amount ?? 0)
      : 0;
    paymentTerms = context.contract.balance_due_date
      ? `Remaining balance due by ${context.contract.balance_due_date}.`
      : null;
  }

  if (type === "invoice" && context.contract) {
    depositRequired = Number(context.contract.deposit_amount ?? depositRequired);
    amountPaid = context.contract.deposit_paid
      ? Number(context.contract.deposit_amount ?? amountPaid)
      : amountPaid;
    paymentInstructions = "Payment may be made via bank transfer, Zelle, or approved card payment.";
    paymentTerms = paymentTerms ?? "Payment secures your event date and confirms production scheduling.";
  }

  if (type === "receipt" && context.contract) {
    amountPaid = Number(context.contract.deposit_paid ? context.contract.deposit_amount ?? 0 : 0);
    paymentInstructions = null;
    paymentTerms = "Thank you for your payment. Keep this receipt for your records.";
  }

  const totals = calculateDocumentTotals({
    lineItems,
    deliveryFee,
    setupFee,
    discountAmount,
    taxAmount,
    amountPaid,
    depositRequired,
  });

  return {
    ...blank,
    inquiry_id: context.inquiry?.id ?? null,
    contract_id: context.contract?.id ?? null,
    customer_name: customerName || "",
    customer_email: customerEmail,
    customer_phone: customerPhone,
    event_type: eventType,
    event_date: eventDate,
    guest_count: guestCount,
    venue_name: venueName,
    venue_address: venueAddress,
    line_items: lineItems,
    notes,
    inclusions,
    payment_terms: paymentTerms,
    payment_instructions: paymentInstructions,
    delivery_fee: deliveryFee,
    setup_fee: setupFee,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    subtotal: totals.subtotal,
    total_amount: totals.totalAmount,
    deposit_required: depositRequired,
    amount_paid: amountPaid,
    balance_due: totals.balanceDue,
    related_quote_id: relatedQuoteId,
    related_invoice_id: relatedInvoiceId,
  };
}

export function buildDocumentNumber(type: ClientDocumentType, countHint: number) {
  const prefix = type === "quote" ? "QT" : type === "invoice" ? "INV" : "RCT";
  const next = String(countHint + 1).padStart(4, "0");
  return `${prefix}-${new Date().getFullYear()}-${next}`;
}
