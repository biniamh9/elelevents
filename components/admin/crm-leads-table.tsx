import Link from "next/link";
import { CRM_STAGE_LABELS, type CrmLead, type LeadSource } from "@/lib/crm-analytics";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function stageTone(stage: CrmLead["stage"]) {
  if (stage === "booked") return "booked";
  if (stage === "quote_sent") return "quoted";
  if (stage === "lost") return "closed_lost";
  if (stage === "contacted" || stage === "consultation_scheduled" || stage === "consultation_completed") return "contacted";
  return "new";
}

export default function CrmLeadsTable({
  leads,
  filters,
}: {
  leads: CrmLead[];
  filters: {
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    dateRange?: string;
    q?: string;
  };
}) {
  const eventTypes = [...new Set(leads.map((lead) => lead.eventType))];
  const owners = [...new Set(leads.map((lead) => lead.owner))];
  const sources = [...new Set(leads.map((lead) => lead.source))] as LeadSource[];

  return (
    <section className="card admin-section-card admin-panel admin-panel--wide crm-leads-section">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Leads</p>
          <h3>Active relationship pipeline</h3>
        </div>
      </div>

      <form className="admin-record-filters admin-filters admin-filters--records crm-filter-grid crm-filter-grid--leads" action="/admin/crm-analytics">
        <input type="hidden" name="tab" value="leads" />
        <label>
          <span>Search</span>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Client, venue, email" />
        </label>
        <label>
          <span>Stage</span>
          <select name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">All</option>
            {Object.entries(CRM_STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Event type</span>
          <select name="eventType" defaultValue={filters.eventType ?? ""}>
            <option value="">All</option>
            {eventTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Source</span>
          <select name="source" defaultValue={filters.source ?? ""}>
            <option value="">All</option>
            {sources.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Owner</span>
          <select name="owner" defaultValue={filters.owner ?? ""}>
            <option value="">All</option>
            {owners.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Date range</span>
          <select name="dateRange" defaultValue={filters.dateRange ?? ""}>
            <option value="">All dates</option>
            <option value="30">Next 30 days</option>
            <option value="60">Next 60 days</option>
            <option value="90">Next 90 days</option>
          </select>
        </label>
        <button type="submit" className="btn secondary">
          Apply
        </button>
      </form>

      <div className="admin-record-table-shell">
        <table className="admin-records-table crm-records-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Event Type</th>
              <th>Event Date</th>
              <th>Stage</th>
              <th>Estimated Value</th>
              <th>Last Contact</th>
              <th>Next Follow-up</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <strong>{lead.clientName}</strong>
                  <small>{lead.email}</small>
                </td>
                <td>{lead.eventType}</td>
                <td>{formatDate(lead.eventDate)}</td>
                <td>
                  <span className={`admin-status-badge admin-status-badge--${stageTone(lead.stage)}`}>
                    {CRM_STAGE_LABELS[lead.stage]}
                  </span>
                </td>
                <td>${lead.estimatedValue.toLocaleString()}</td>
                <td>{formatDate(lead.lastContact)}</td>
                <td>{formatDate(lead.nextFollowUp)}</td>
                <td>{lead.owner}</td>
                <td className="admin-record-cell-actions">
                  <details className="admin-row-action-menu">
                    <summary className="admin-row-action-trigger">
                      <span>Actions</span>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="m5 7 5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="admin-row-action-dropdown">
                      <Link href={`/admin/crm-analytics/${lead.id}`} className="admin-row-action-item">View lead</Link>
                      <Link href={`/admin/crm-analytics/${lead.id}#notes`} className="admin-row-action-item">Add note</Link>
                      <Link href={`/admin/crm-analytics/${lead.id}#tasks`} className="admin-row-action-item">Schedule follow-up</Link>
                      <Link href={`/admin/crm-analytics/${lead.id}#stage`} className="admin-row-action-item">Move stage</Link>
                      <Link href="/admin/documents/new?type=quote" className="admin-row-action-item">Create quote</Link>
                      <Link href={`/admin/crm-analytics/${lead.id}#booking`} className="admin-row-action-item">Mark booked</Link>
                      <Link href={`/admin/crm-analytics/${lead.id}#lost`} className="admin-row-action-item">Mark lost</Link>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
