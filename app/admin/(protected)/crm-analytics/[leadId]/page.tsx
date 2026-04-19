import Link from "next/link";
import { notFound } from "next/navigation";
import { getCrmLeadById, getLeadInteractions, getLeadTasks, CRM_STAGE_LABELS } from "@/lib/crm-analytics";
import { getPersistedCrmTasks } from "@/lib/crm-follow-up-tasks";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export default async function AdminCrmLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = getCrmLeadById(leadId);

  if (!lead) {
    notFound();
  }

  const interactions = getLeadInteractions(leadId);
  const tasks = getLeadTasks(leadId);
  const persistedTasks = await getPersistedCrmTasks(supabaseAdmin, {
    inquiryId: leadId,
    status: "open",
  });
  const { data: persistedInteractions } = await supabaseAdmin
    .from("customer_interactions")
    .select("id, subject, body_text, created_at, channel, direction, provider")
    .or(`sender_email.eq.${lead.email},recipient_email.eq.${lead.email}`)
    .order("created_at", { ascending: false })
    .limit(20);

  const combinedInteractions = [
    ...interactions.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      createdAt: item.createdAt,
    })),
    ...(persistedInteractions ?? []).map((item) => ({
      id: item.id,
      title:
        item.subject?.trim() ||
        (item.direction === "inbound" ? "Email reply received" : "Customer interaction"),
      summary: item.body_text,
      createdAt: item.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 24);

  const combinedTasks = [...persistedTasks, ...tasks].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <main className="admin-page section admin-page--workspace">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">CRM &amp; Analytics</p>
          <h1>{lead.clientName}</h1>
          <p className="lead">{lead.eventType} at {lead.venue} · {formatDate(lead.eventDate)}</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/crm-analytics" className="admin-topbar-pill">Back to CRM</Link>
          <Link href="/admin/documents/new?type=quote" className="btn">Create quote</Link>
        </div>
      </div>

      <div className="admin-dashboard-row">
        <section className="card admin-section-card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customer info</p>
              <h3>Relationship overview</h3>
            </div>
          </div>
          <div className="booking-final-summary-grid">
            <div><small>Email</small><span>{lead.email}</span></div>
            <div><small>Phone</small><span>{lead.phone}</span></div>
            <div><small>Budget range</small><span>{lead.budgetRange}</span></div>
            <div><small>Stage</small><span>{CRM_STAGE_LABELS[lead.stage]}</span></div>
            <div><small>Quote summary</small><span>{lead.quoteSummary}</span></div>
            <div><small>Payment summary</small><span>{lead.paymentSummary}</span></div>
          </div>

          <div id="notes" className="admin-placeholder-list">
            {lead.notes.map((note) => (
              <div key={note}>
                <strong>Note</strong>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="card admin-section-card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Follow-up tasks</p>
              <h3>Next actions</h3>
            </div>
          </div>
          <div id="tasks" className="crm-task-list">
            {combinedTasks.map((task) => (
              <div key={task.id} className="crm-task-row">
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.detail || task.dueLabel}</span>
                </div>
                <small>{task.dueLabel}</small>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="card admin-section-card admin-panel admin-panel--wide">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Interaction timeline</p>
            <h3>Recent activity</h3>
          </div>
        </div>
        <div className="admin-list crm-interactions-list">
          {combinedInteractions.map((item) => (
            <div key={item.id} className="admin-list-item crm-interaction-item">
              <div>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </div>
              <small>{formatRelative(item.createdAt)}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
