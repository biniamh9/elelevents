import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { createElement } from "react";
import { NextResponse } from "next/server";
import DocumentPdfFile from "@/components/forms/admin/document-pdf-file";
import { getDocumentById } from "@/lib/admin-documents";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { buildInquiryReplyToAddress } from "@/lib/crm-opportunity-identity";
import { extractEmailAddress } from "@/lib/email-delivery-metadata";
import { getBusinessTemplateVariables, getNotificationFromEmail } from "@/lib/email-template-renderer";
import { recordOutboundEmailInteraction } from "@/lib/customer-interactions";
import { documentTypeLabels, formatDocumentDate, formatMoney } from "@/lib/client-documents";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildPdfFilename(documentNumber: string, documentType: string) {
  const safeBase = `${documentNumber || documentType}`
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeBase || "document"}.pdf`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDocumentEmailHtml(input: {
  customerName: string;
  documentLabel: string;
  documentNumber: string;
  eventLabel: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentInstructions: string | null;
}) {
  const firstName = input.customerName.trim().split(/\s+/)[0] || "there";
  const paymentInstructions = input.paymentInstructions?.trim();

  return `
    <div style="margin:0;padding:0;background:#f6efe7;font-family:Georgia,'Times New Roman',serif;color:#172033;">
      <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
        <div style="background:#fffdfa;border:1px solid rgba(73,49,31,0.12);border-radius:26px;padding:30px;box-shadow:0 18px 45px rgba(31,24,18,0.08);">
          <p style="margin:0 0 12px;color:#b46128;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Elel Events & Design</p>
          <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;color:#172033;">Your ${escapeHtml(input.documentLabel)} is attached</h1>
          <p style="margin:0 0 22px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#5f554c;">
            Hi ${escapeHtml(firstName)},<br/>
            Thank you for choosing Elel Events & Design. We attached your ${escapeHtml(input.documentLabel.toLowerCase())} for ${escapeHtml(input.eventLabel)}.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border:1px solid rgba(73,49,31,0.12);border-radius:18px;overflow:hidden;font-family:Arial,sans-serif;">
            <tr>
              <td style="padding:12px 14px;background:#faf4ec;color:#6d5f52;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Document</td>
              <td style="padding:12px 14px;text-align:right;font-weight:700;">${escapeHtml(input.documentNumber)}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;color:#6d5f52;">Issue date</td>
              <td style="padding:12px 14px;text-align:right;font-weight:700;">${escapeHtml(input.issueDate)}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;color:#6d5f52;">Due date</td>
              <td style="padding:12px 14px;text-align:right;font-weight:700;">${escapeHtml(input.dueDate)}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;color:#6d5f52;">Total</td>
              <td style="padding:12px 14px;text-align:right;font-weight:700;">$${formatMoney(input.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;color:#6d5f52;">Paid / credited</td>
              <td style="padding:12px 14px;text-align:right;font-weight:700;">$${formatMoney(input.amountPaid)}</td>
            </tr>
            <tr>
              <td style="padding:14px;background:#fff6ed;color:#6d3b17;font-weight:700;">Remaining balance</td>
              <td style="padding:14px;background:#fff6ed;text-align:right;color:#6d3b17;font-size:18px;font-weight:800;">$${formatMoney(input.balanceDue)}</td>
            </tr>
          </table>

          ${
            paymentInstructions
              ? `<p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#5f554c;"><strong style="color:#172033;">Payment instructions:</strong><br/>${escapeHtml(paymentInstructions).replace(/\n/g, "<br/>")}</p>`
              : ""
          }

          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#5f554c;">
            Please reply to this email if you have any questions or need us to make an adjustment.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const document = await getDocumentById(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.document_type !== "invoice") {
      return NextResponse.json({ error: "Only invoices can be emailed from this action." }, { status: 400 });
    }

    if (!document.customer_email?.trim()) {
      return NextResponse.json({ error: "Customer email is required before sending the invoice." }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
    }

    const fromEmail = getNotificationFromEmail();
    const business = getBusinessTemplateVariables();
    const documentLabel = documentTypeLabels[document.document_type];
    const eventLabel = document.event_type || document.venue_name || "your event";
    const subject = `${documentLabel} ${document.document_number} from Elel Events & Design`;
    const bodyText = `Invoice ${document.document_number} sent to ${document.customer_email}. Balance due: $${formatMoney(document.balance_due)}.`;
    const pdfElement = createElement(DocumentPdfFile, { document, printCompact: true }) as Parameters<
      typeof renderToBuffer
    >[0];
    const pdfBuffer = await renderToBuffer(pdfElement);
    const html = renderDocumentEmailHtml({
      customerName: document.customer_name,
      documentLabel,
      documentNumber: document.document_number,
      eventLabel,
      issueDate: formatDocumentDate(document.issue_date),
      dueDate: formatDocumentDate(document.due_date),
      totalAmount: document.total_amount,
      amountPaid: document.amount_paid,
      balanceDue: document.balance_due,
      paymentInstructions: document.payment_instructions,
    });

    const conversationKey =
      document.inquiry_id
        ? (
            await supabaseAdmin
              .from("event_inquiries")
              .select("client_id, crm_conversation_key")
              .eq("id", document.inquiry_id)
              .maybeSingle()
          ).data
        : null;

    const { data: sentEmail, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: document.customer_email,
      subject,
      replyTo: buildInquiryReplyToAddress(
        extractEmailAddress(fromEmail),
        conversationKey?.crm_conversation_key ?? null
      ),
      html,
      attachments: [
        {
          filename: buildPdfFilename(document.document_number, document.document_type),
          content: pdfBuffer,
        },
      ],
    });

    if (sendError) {
      console.error("Invoice email send failed:", sendError);
      return NextResponse.json({ error: sendError.message || "Invoice email failed to send" }, { status: 500 });
    }

    const nextStatus =
      document.status === "draft" || document.status === "unpaid"
        ? "sent"
        : document.status;

    const { data: updatedDocument, error: updateError } = await supabaseAdmin
      .from("client_documents")
      .update({ status: nextStatus })
      .eq("id", document.id)
      .select("*")
      .single();

    if (updateError || !updatedDocument) {
      return NextResponse.json(
        { error: updateError?.message || "Invoice email sent, but document status could not be updated." },
        { status: 500 }
      );
    }

    if (document.inquiry_id) {
      await recordOutboundEmailInteraction(supabaseAdmin, {
        inquiryId: document.inquiry_id,
        clientId: conversationKey?.client_id ?? null,
        subject,
        bodyText,
        senderEmail: extractEmailAddress(fromEmail),
        recipientEmail: document.customer_email,
        conversationKey: conversationKey?.crm_conversation_key ?? null,
        threadId: sentEmail?.id ?? null,
        messageId: sentEmail?.id ?? null,
        provider: "resend",
        metadata: {
          type: "invoice_email",
          document_id: document.id,
          document_number: document.document_number,
          total_amount: document.total_amount,
          amount_paid: document.amount_paid,
          balance_due: document.balance_due,
          website_url: business.website_url,
        },
      });
    }

    await logActivity(supabaseAdmin, {
      entityType: "document",
      entityId: document.id,
      action: "invoice.sent",
      summary: "Invoice emailed to customer",
      actorId: auth.user.id,
      metadata: {
        customer_email: document.customer_email,
        document_number: document.document_number,
        sent_email_id: sentEmail?.id ?? null,
        total_amount: document.total_amount,
        amount_paid: document.amount_paid,
        balance_due: document.balance_due,
        previous_status: document.status,
        status: nextStatus,
      },
    });

    if (document.inquiry_id) {
      await logActivity(supabaseAdmin, {
        entityType: "inquiry",
        entityId: document.inquiry_id,
        action: "invoice.sent",
        summary: "Invoice emailed to customer",
        actorId: auth.user.id,
        metadata: {
          document_id: document.id,
          document_number: document.document_number,
          customer_email: document.customer_email,
          balance_due: document.balance_due,
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      sentEmailId: sentEmail?.id ?? null,
    });
  } catch (error) {
    console.error("Send invoice email failed:", error);
    return NextResponse.json({ error: "Failed to send invoice email" }, { status: 500 });
  }
}
