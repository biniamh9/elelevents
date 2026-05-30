import Link from "next/link";
import EmailHistoryPanel from "@/components/admin/email-history-panel";
import { requireAdminPage } from "@/lib/auth/admin";
import { buildCrmWorkspaceHref } from "@/lib/admin-navigation";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminEmailLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage("crm");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const emailQuery = supabaseAdmin
    .from("customer_interactions")
    .select("id, subject, body_text, created_at, sender_email, recipient_email, provider, message_id, thread_id, metadata")
    .eq("channel", "email")
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(150);

  const { data: emails } = await emailQuery;
  const normalizedQuery = query.toLowerCase();
  const filteredEmails = normalizedQuery
    ? (emails ?? []).filter((email) =>
        [email.subject, email.recipient_email, email.sender_email, email.body_text]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      )
    : (emails ?? []);

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>Email Log</h1>
          <p>Track outgoing quote, invoice, receipt, contract, consultation, and reminder emails sent from the admin portal.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("reports")} className="admin-head-pill">
            Back to reports
          </Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          This log confirms emails recorded by the CRM after an admin send action. Delivery, bounce, and open tracking should be added with a Resend webhook.
        </p>
      </section>

      <form className="card admin-table-card admin-management-card admin-reference-records-shell">
        <div className="admin-document-filter-row admin-document-filter-row--reference">
          <input
            className="input"
            name="q"
            defaultValue={query}
            placeholder="Search subject or email address"
          />
        </div>
        <div className="admin-document-inline-actions">
          <button type="submit" className="btn">Search email log</button>
          <Link href="/admin/crm-analytics/reports/email-log" className="btn secondary">
            Reset
          </Link>
        </div>
      </form>

      <EmailHistoryPanel
        emails={filteredEmails}
        title="All outgoing email"
        description="Most recent outbound emails recorded by the CRM."
        showViewAllLink={false}
      />
    </main>
  );
}
