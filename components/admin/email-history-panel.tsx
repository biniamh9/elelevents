import Link from "next/link";

export type EmailHistoryRow = {
  id: string;
  subject: string | null;
  body_text?: string | null;
  created_at: string;
  sender_email?: string | null;
  recipient_email?: string | null;
  provider?: string | null;
  message_id?: string | null;
  thread_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEmailStatus(row: EmailHistoryRow) {
  const metadataStatus =
    typeof row.metadata?.delivery_status === "string"
      ? row.metadata.delivery_status
      : typeof row.metadata?.status === "string"
        ? row.metadata.status
        : null;

  if (metadataStatus) return metadataStatus.replaceAll("_", " ");
  if (row.message_id) return "sent to provider";
  return "logged";
}

function getEmailType(row: EmailHistoryRow) {
  const type = typeof row.metadata?.type === "string" ? row.metadata.type : null;
  if (type) return type.replaceAll("_", " ");
  return "outbound email";
}

function getRelatedDocumentId(row: EmailHistoryRow) {
  return typeof row.metadata?.document_id === "string" ? row.metadata.document_id : null;
}

export default function EmailHistoryPanel({
  emails,
  title = "Email history",
  description = "Outgoing emails recorded by the CRM. Delivery confirmation requires provider webhook tracking.",
  showViewAllLink = true,
}: {
  emails: EmailHistoryRow[];
  title?: string;
  description?: string;
  showViewAllLink?: boolean;
}) {
  return (
    <section className="card admin-section-card admin-panel admin-reference-records-shell">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Communication log</p>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
        {showViewAllLink ? (
          <Link href="/admin/crm-analytics/reports/email-log" className="admin-head-pill">
            View all email
          </Link>
        ) : null}
      </div>

      <div className="admin-placeholder-list">
        {emails.length ? (
          emails.map((email) => {
            const documentId = getRelatedDocumentId(email);
            return (
              <div key={email.id}>
                <strong>
                  <Link href={`/admin/crm-analytics/reports/email-log/${email.id}`}>
                    {email.subject || "No subject recorded"}
                  </Link>
                </strong>
                <span>
                  {getEmailType(email)} · {getEmailStatus(email)} · to{" "}
                  {email.recipient_email || "unknown recipient"} · {formatDate(email.created_at)}
                  {email.provider ? ` · ${email.provider}` : ""}
                  {" "}·{" "}
                  <Link href={`/admin/crm-analytics/reports/email-log/${email.id}`}>
                    View email details
                  </Link>
                  {documentId ? (
                    <>
                      {" "}
                      · <Link href={`/admin/documents/${documentId}`}>Open document</Link>
                    </>
                  ) : null}
                </span>
                {email.body_text ? <span>{email.body_text}</span> : null}
              </div>
            );
          })
        ) : (
          <div>
            <strong>No outgoing email recorded yet</strong>
            <span>Sent quotes, invoices, receipts, contracts, and reminders will appear here once emailed from the admin portal.</span>
          </div>
        )}
      </div>
    </section>
  );
}
