import { Resend } from "resend";

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

export function canSendBookingEmail() {
  return Boolean(resend && process.env.NOTIFICATION_FROM_EMAIL);
}

export async function sendBookingLifecycleEmail(
  type: BookingEmailType,
  contract: ContractEmailRecord
) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!process.env.NOTIFICATION_FROM_EMAIL) {
    throw new Error("NOTIFICATION_FROM_EMAIL is not configured");
  }

  if (!contract.client_email || !contract.client_name) {
    throw new Error("Client email and name are required");
  }

  const eventLabel = contract.event_type || "your event";
  const eventDate = contract.event_date || "TBD";
  const venue = contract.venue_name || "your venue";
  const deposit = Number(contract.deposit_amount ?? 0).toLocaleString();
  const balance = Number(contract.balance_due ?? 0).toLocaleString();

  const templates: Record<BookingEmailType, { subject: string; html: string }> = {
    deposit_receipt: {
      subject: `Deposit received for ${eventLabel}`,
      html: `
        <h2>Hello ${contract.client_name},</h2>
        <p>We have received your deposit for ${eventLabel} on ${eventDate}.</p>
        <p><strong>Deposit received:</strong> $${deposit}</p>
        <p>Your date is now moving into our reserved calendar workflow. We will follow up with the next preparation steps soon.</p>
        <p>Thank you,<br/>Elel Events & Design</p>
      `,
    },
    final_payment_reminder: {
      subject: `Final payment reminder for ${eventLabel}`,
      html: `
        <h2>Hello ${contract.client_name},</h2>
        <p>This is a friendly reminder about the remaining balance for ${eventLabel} at ${venue}.</p>
        <p><strong>Remaining balance:</strong> $${balance}</p>
        <p><strong>Due date:</strong> ${contract.balance_due_date || "To be confirmed"}</p>
        <p>If you have already sent payment, please reply so we can confirm it.</p>
        <p>Thank you,<br/>Elel Events & Design</p>
      `,
    },
    final_payment_confirmation: {
      subject: `Final payment confirmed for ${eventLabel}`,
      html: `
        <h2>Hello ${contract.client_name},</h2>
        <p>Your final payment has been confirmed for ${eventLabel} on ${eventDate}.</p>
        <p>We are now fully confirmed on our side and will move into final event execution and setup planning.</p>
        <p>Thank you for trusting Elel Events & Design.</p>
        <p>Warmly,<br/>Elel Events & Design</p>
      `,
    },
  };

  const template = templates[type];
  const { error } = await resend.emails.send({
    from: process.env.NOTIFICATION_FROM_EMAIL,
    to: contract.client_email,
    subject: template.subject,
    html: template.html,
  });

  if (error) {
    throw new Error(error.message || "Email failed to send");
  }
}
