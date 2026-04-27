import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { getCrmLeadWorkflowActionGroups } from "@/lib/admin-workflow-lane";
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
  revisionLeadIds,
  followUpSummary,
  followUpFilterHref,
  clearFollowUpFilterHref,
}: {
  leads: CrmLead[];
  filters: {
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    nextAction?: string;
    dateRange?: string;
    q?: string;
    followUp?: string;
  };
  revisionLeadIds?: Set<string>;
  followUpSummary?: {
    pending: number;
    reviewed: number;
  };
  followUpFilterHref: string;
  clearFollowUpFilterHref: string;
}) {
  const eventTypes = [...new Set(leads.map((lead) => lead.eventType))];
  const owners = [...new Set(leads.map((lead) => lead.owner))];
  const sources = [...new Set(leads.map((lead) => lead.source))] as LeadSource[];
  const followUpFilterActive = filters.followUp === "with_inspiration";

  return (
    <section className="card admin-section-card admin-panel admin-panel--wide crm-leads-section">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Leads</p>
          <h3>Active relationship pipeline</h3>
        </div>
        {followUpSummary ? (
          <div className="admin-inline-actions">
            <span className="admin-head-pill">Follow-up pending: {followUpSummary.pending}</span>
            <span className="admin-head-pill">Reviewed: {followUpSummary.reviewed}</span>
            <a
              href={followUpFilterHref}
              className={`admin-head-pill${followUpFilterActive ? " admin-head-pill--active" : ""}`}
            >
              Pending follow-up review
            </a>
            {followUpFilterActive ? (
              <a
                href={clearFollowUpFilterHref}
                className="admin-head-pill admin-head-pill--clear"
              >
                Clear follow-up filter
              </a>
            ) : null}
          </div>
        ) : null}
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
          <span>Next action</span>
          <select name="nextAction" defaultValue={filters.nextAction ?? ""}>
            <option value="">All</option>
            <option value="set">Has next action</option>
            <option value="overdue">Action overdue</option>
            <option value="none">Not set</option>
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
        <label className={followUpFilterActive ? "admin-filter-field--active" : undefined}>
          <span>Follow-up</span>
          <select name="followUp" defaultValue={filters.followUp ?? ""}>
            <option value="">All</option>
            <option value="with_inspiration">Has follow-up inspiration</option>
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
              <th>Next Action</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const needsRevision = revisionLeadIds?.has(lead.id) ?? false;
              const hasFollowUpInspiration = lead.hasFollowUpInspiration ?? false;

              return (
              <tr
                key={lead.id}
                className={needsRevision || hasFollowUpInspiration ? "admin-record-row--attention" : undefined}
              >
                <td>
                  <div className="admin-record-main">
                    <strong>{lead.clientName}</strong>
                    <small>{lead.email}</small>
                    {needsRevision ? (
                      <span className="admin-inline-attention-chip">
                        Client requested quote changes
                      </span>
                    ) : null}
                    {hasFollowUpInspiration ? (
                      <span className="admin-inline-attention-chip">
                        Follow-up inspiration added
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>{lead.eventType}</td>
                <td>{formatDate(lead.eventDate)}</td>
                <td>
                  <div className="admin-record-status-stack">
                    <span className={`admin-status-badge admin-status-badge--${stageTone(lead.stage)}`}>
                      {CRM_STAGE_LABELS[lead.stage]}
                    </span>
                    {needsRevision ? (
                      <span className="admin-record-substatus">Quote revision needed</span>
                    ) : hasFollowUpInspiration ? (
                      <span className="admin-record-substatus">Inspiration follow-up ready for review</span>
                    ) : null}
                  </div>
                </td>
                <td>${lead.estimatedValue.toLocaleString()}</td>
                <td>{formatDate(lead.lastContact)}</td>
                <td>{formatDate(lead.nextFollowUp)}</td>
                <td>
                  <div className="admin-record-main">
                    <strong>{lead.nextAction || "Not set"}</strong>
                    <small>
                      {lead.nextActionDueAt
                        ? `Due ${formatDate(lead.nextActionDueAt)}`
                        : "No due date"}
                    </small>
                  </div>
                </td>
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
                      {getCrmLeadWorkflowActionGroups(lead).map((group) => (
                        <div key={`${lead.id}-${group.title}`} className="admin-row-action-group">
                          <p className="admin-row-action-group-label">{group.title}</p>
                          {group.actions.map((action) => (
                            <AdminWorkflowAction
                              key={`${lead.id}-${group.title}-${action.label}`}
                              href={action.href}
                              className="admin-workflow-action--menu"
                              tone={group.title === "Current step" ? "internal" : "record"}
                              label={action.label}
                              description={
                                group.title === "Current step"
                                  ? "Open the next working step for this lead."
                                  : group.title === "Lead record"
                                    ? "Open the lead record or add internal context."
                                    : "Open the next related workflow area for this lead."
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </section>
  );
}
