import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { getCrmLeadWorkflowActionGroups } from "@/lib/admin-workflow-lane";
import { buildUnmatchedReplyReviewHref } from "@/lib/admin-navigation";
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
  if (
    stage === "contacted" ||
    stage === "consultation_scheduled" ||
    stage === "consultation_completed"
  ) {
    return "contacted";
  }
  return "new";
}

export default function CrmLeadsTable({
  leads,
  filters,
  revisionLeadIds,
  followUpSummary,
  followUpFilterHref,
  clearFollowUpFilterHref,
  unmatchedReplyCandidateCounts,
  unmatchedReplyReviewHrefs,
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
  unmatchedReplyCandidateCounts?: Record<string, number>;
  unmatchedReplyReviewHrefs?: Record<string, string>;
}) {
  const eventTypes = [...new Set(leads.map((lead) => lead.eventType))];
  const owners = [...new Set(leads.map((lead) => lead.owner))];
  const sources = [...new Set(leads.map((lead) => lead.source))] as LeadSource[];
  const followUpFilterActive = filters.followUp === "with_inspiration";

  return (
    <section className="admin-record-section crm-leads-section">
      <div className="card admin-table-card admin-management-card admin-reference-records-shell">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Leads</p>
            <h3>Active relationship pipeline</h3>
            <p className="muted">
              Search and filter the CRM relationship pipeline without losing visibility into
              ownership, stage, and next action.
            </p>
          </div>
        </div>

        <div className="admin-reference-head-pills">
          <span className="admin-reference-head-pill admin-reference-head-pill--strong">
            Showing {leads.length} leads
          </span>
          {followUpSummary ? (
            <>
              <span className="admin-reference-head-pill">Follow-up pending</span>
              <span className="admin-reference-head-pill">{followUpSummary.pending}</span>
              <span className="admin-reference-head-pill">Reviewed</span>
              <span className="admin-reference-head-pill">{followUpSummary.reviewed}</span>
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
            </>
          ) : null}
        </div>

        <form
          className="admin-record-filters admin-filters admin-filters--records crm-filter-grid crm-filter-grid--leads"
          action="/admin/crm-analytics"
        >
          <input type="hidden" name="tab" value="leads" />

          <label className="admin-reference-filter-group" style={{ gridColumn: "1 / -1" }}>
            <p>Search</p>
            <input name="q" defaultValue={filters.q ?? ""} placeholder="Client, venue, email" />
          </label>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <label className="admin-reference-filter-group">
              <p>Stage</p>
              <select name="stage" defaultValue={filters.stage ?? ""}>
                <option value="">All</option>
                {Object.entries(CRM_STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-reference-filter-group">
              <p>Event type</p>
              <select name="eventType" defaultValue={filters.eventType ?? ""}>
                <option value="">All</option>
                {eventTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <label className="admin-reference-filter-group">
              <p>Source</p>
              <select name="source" defaultValue={filters.source ?? ""}>
                <option value="">All</option>
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-reference-filter-group">
              <p>Owner</p>
              <select name="owner" defaultValue={filters.owner ?? ""}>
                <option value="">All</option>
                {owners.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <label className="admin-reference-filter-group">
              <p>Next action</p>
              <select name="nextAction" defaultValue={filters.nextAction ?? ""}>
                <option value="">All</option>
                <option value="set">Has next action</option>
                <option value="overdue">Action overdue</option>
                <option value="none">Not set</option>
              </select>
            </label>
            <label className="admin-reference-filter-group">
              <p>Date range</p>
              <select name="dateRange" defaultValue={filters.dateRange ?? ""}>
                <option value="">All dates</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
              </select>
            </label>
          </div>

          <label
            className={`admin-reference-filter-group${followUpFilterActive ? " admin-filter-field--active" : ""}`}
            style={{ gridColumn: "1 / -1" }}
          >
            <p>Follow-up</p>
            <select name="followUp" defaultValue={filters.followUp ?? ""}>
              <option value="">All</option>
              <option value="with_inspiration">Has follow-up inspiration</option>
            </select>
          </label>

          <button type="submit" className="btn secondary">
            Apply
          </button>
        </form>
      </div>

      <div className="card admin-table-card admin-records-table-card">
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
                const unmatchedReplyCandidateCount =
                  unmatchedReplyCandidateCounts?.[lead.id] ?? 0;
                const hasUnmatchedReplyCandidate = unmatchedReplyCandidateCount > 0;
                const unmatchedReplyReviewHref =
                  unmatchedReplyReviewHrefs?.[lead.id] ??
                  buildUnmatchedReplyReviewHref({ status: "pending_review" });

                return (
                  <tr
                    key={lead.id}
                    className={
                      needsRevision || hasFollowUpInspiration || hasUnmatchedReplyCandidate
                        ? "admin-record-row--attention"
                        : undefined
                    }
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
                        {hasUnmatchedReplyCandidate ? (
                          <span className="admin-inline-attention-chip">
                            Has unmatched reply candidate
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
                          <span className="admin-record-substatus">
                            Inspiration follow-up ready for review
                          </span>
                        ) : hasUnmatchedReplyCandidate ? (
                          <span className="admin-record-substatus">
                            Reply review pending for this lead
                          </span>
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
                            <path
                              d="m5 7 5 6 5-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
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
                          {hasUnmatchedReplyCandidate ? (
                            <div className="admin-row-action-group">
                              <p className="admin-row-action-group-label">Reply review</p>
                              <AdminWorkflowAction
                                href={unmatchedReplyReviewHref}
                                className="admin-workflow-action--menu"
                                tone="email"
                                label={
                                  unmatchedReplyCandidateCount === 1
                                    ? "Review unmatched reply candidate"
                                    : `Review ${unmatchedReplyCandidateCount} unmatched reply candidates`
                                }
                                description="Open the safe review queue and attach the inbound reply only if this is the correct opportunity."
                              />
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
