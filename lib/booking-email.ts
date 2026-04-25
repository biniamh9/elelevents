import { Resend } from "resend";
import { getNotificationFromEmail, renderEmailTemplate } from "@/lib/email-template-renderer";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type BookingEmailType =
  | "deposit_receipt"
  | "final_payment_reminder"
  | "final_payment_confirmation";

type ContractEmailRecord = {
  client_name?: string | null;
  client_email?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  venue_name?: string | null;
  contract_total?: number | null;
  deposit_amount?: number | null;
  balance_due?: number | null;
  balance_due_date?: string | null;
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}

function firstNameFrom(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function getPaymentInstructions(contract: ContractEmailRecord) {
  const venueNote = contract.venue_name
    ? `Reference ${contract.venue_name} when confirming your payment with our team.`
    : "Reference your event name when confirming your payment with our team.";

  return `Please submit your payment using the approved Elel Events payment method on file and include your client name in the reference. ${venueNote}`;
}

export function canSendBookingEmail() {
  return Boolean(resend);
}

export async function sendBookingLifecycleEmail(
  type: BookingEmailType,
  contract: ContractEmailRecord
) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const fromEmail = getNotificationFromEmail();

  if (!contract.client_email || !contract.client_name) {
    throw new Error("Client email and name are required");
  }

  const templateKey =
    type === "final_payment_confirmation" ? "payment_received" : type;
  const rendered = renderEmailTemplate(templateKey, {
    customer_first_name: firstNameFrom(contract.client_name),
    customer_full_name: contract.client_name,
    event_type: contract.event_type || "Your event",
    event_date: contract.event_date || "To be confirmed",
    balance_due: formatCurrency(contract.balance_due),
    balance_due_date: contract.balance_due_date || "To be confirmed",
    payment_amount:
      type === "deposit_receipt"
        ? formatCurrency(contract.deposit_amount)
        : formatCurrency(contract.balance_due),
    meeting_location: contract.venue_name || "",
    payment_instructions: getPaymentInstructions(contract),
  });

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: contract.client_email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (error) {
    throw new Error(error.message || "Email failed to send");
  }
}
