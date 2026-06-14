import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildContractDetailHref,
  buildCrmCustomerDetailHref,
  buildDocumentDetailHref,
  buildInquiryDetailHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function humanize(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not recorded";
}

export default async function AdminEmailLogDetailPage({
  params,
}: {
  params: Promise<{ emailId: string }>;
}) {
  await requireAdminPage("crm");

  const { emailId } = await params;
  const { data: email } = await supabaseAdmin
    .from("customer_interactions")
    .select("*")
    .eq("id", emailId)
    .eq("channel", "email")
    .eq("direction", "outbound")
    .maybeSingle();

  if (!email) {
    notFound();
  }

  const metadata =
    email.metadata && typeof email.metadata === "object" && !Array.isArray(email.metadata)
      ? (email.metadata as Record<string, unknown>)
      : {};
  const documentId =
    typeof metadata.document_id === "string" ? metadata.document_id : null;
  const emailType =
    typeof metadata.type === "string" ? metadata.type : "outbound_email";
  const deliveryStatus =
    typeof metadata.delivery_status === "string"
      ? metadata.delivery_status
      : typeof metadata.status === "string"
        ? metadata.status
        : email.message_id
          ? "sent_to_provider"
          : "logged";

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>{email.subject || "Outgoing email details"}</h1>
          <p>Review what the CRM recorded for this specific outgoing email.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/crm-analytics/reports/email-log" className="admin-head-pill">
            Back to Email Log
          </Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Status: <strong>{humanize(deliveryStatus)}</strong>. “Sent to provider” confirms the app handed the email to Resend; inbox delivery requires Resend webhook tracking.
        </p>
      </section>

      <div className="grid-2">
        <section className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Delivery record</p>
              <h3>Email details</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            <div><strong>Status</strong><span>{humanize(deliveryStatus)}</span></div>
            <div><strong>Email type</strong><span>{humanize(emailType)}</span></div>
            <div><strong>Sent at</strong><span>{formatDate(email.created_at)}</span></div>
            <div><strong>From</strong><span>{email.sender_email || "Not recorded"}</span></div>
            <div><strong>To</strong><span>{email.recipient_email || "Not recorded"}</span></div>
            <div><strong>Provider</strong><span>{email.provider || "Not recorded"}</span></div>
            <div><strong>Provider message ID</strong><span>{email.message_id || "Not recorded"}</span></div>
            <div><strong>Thread ID</strong><span>{email.thread_id || "Not recorded"}</span></div>
          </div>
        </section>

        <section className="card admin-section-card admin-panel admin-reference-records-shell">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Related records</p>
              <h3>CRM context</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {email.client_id ? (
              <div><strong>Customer</strong><span><Link href={buildCrmCustomerDetailHref(email.client_id)}>Open customer</Link></span></div>
            ) : null}
            {email.inquiry_id ? (
              <div><strong>Inquiry</strong><span><Link href={buildInquiryDetailHref(email.inquiry_id)}>Open inquiry</Link></span></div>
            ) : null}
            {email.contract_id ? (
              <div><strong>Contract</strong><span><Link href={buildContractDetailHref(email.contract_id)}>Open contract</Link></span></div>
            ) : null}
            {documentId ? (
              <div><strong>Document</strong><span><Link href={buildDocumentDetailHref(documentId)}>Open document</Link></span></div>
            ) : null}
            {!email.client_id && !email.inquiry_id && !email.contract_id && !documentId ? (
              <div><strong>No linked CRM record</strong><span>This email was logged without a customer, inquiry, contract, or document link.</span></div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Message content</p>
            <h3>{email.subject || "No subject recorded"}</h3>
          </div>
        </div>
        <div className="admin-email-log-body">
          {email.body_text || "No plain-text email body was recorded."}
        </div>
      </section>

      <section className="card admin-section-card admin-panel admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Technical audit</p>
            <h3>Recorded metadata</h3>
          </div>
        </div>
        <pre className="admin-email-log-metadata">{JSON.stringify(metadata, null, 2)}</pre>
      </section>
    </main>
  );
}
