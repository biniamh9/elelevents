"use client";

import Link from "next/link";
import CrmLeadRowActions from "@/components/admin/crm-lead-row-actions";
import { buildCrmLeadsHref, buildUnmatchedReplyReviewHref } from "@/lib/admin-navigation";
import { CRM_STAGE_LABELS, type CrmLead, type LeadSource } from "@/lib/crm-analytics";

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
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
  const crmLeadsState = {
    q: filters.q,
    stage: filters.stage,
    eventType: filters.eventType,
    source: filters.source,
    owner: filters.owner,
    nextAction: filters.nextAction,
    dateRange: filters.dateRange,
    followUp: filters.followUp,
  };
  const nextActionOptions = [
    { value: "", label: "All" },
    { value: "set", label: "Has next action" },
    { value: "overdue", label: "Action overdue" },
    { value: "none", label: "Not set" },
  ];
  const dateRangeOptions = [
    { value: "", label: "All dates" },
    { value: "30", label: "Next 30 days" },
    { value: "60", label: "Next 60 days" },
    { value: "90", label: "Next 90 days" },
  ];

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
          <input type="hidden" name="stage" value={filters.stage ?? ""} />
          <input type="hidden" name="eventType" value={filters.eventType ?? ""} />
          <input type="hidden" name="source" value={filters.source ?? ""} />
          <input type="hidden" name="owner" value={filters.owner ?? ""} />
          <input type="hidden" name="nextAction" value={filters.nextAction ?? ""} />
          <input type="hidden" name="dateRange" value={filters.dateRange ?? ""} />
          <input type="hidden" name="followUp" value={filters.followUp ?? ""} />

          <label className="admin-reference-filter-group" style={{ gridColumn: "1 / -1" }}>
            <p>Search</p>
            <input name="q" defaultValue={filters.q ?? ""} placeholder="Client, venue, email" />
          </label>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-reference-filter-group">
              <p>Stage</p>
              <div className="admin-documents-chip-row">
                <Link
                  href={buildCrmLeadsHref({ state: crmLeadsState, nextStage: "" })}
                  className={`admin-documents-chip${!filters.stage ? " is-active" : ""}`}
                >
                  All
                </Link>
                {Object.entries(CRM_STAGE_LABELS).map(([value, label]) => (
                  <Link
                    key={value}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextStage: value })}
                    className={`admin-documents-chip${filters.stage === value ? " is-active" : ""}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="admin-reference-filter-group">
              <p>Event type</p>
              <div className="admin-documents-chip-row">
                <Link
                  href={buildCrmLeadsHref({ state: crmLeadsState, nextEventType: "" })}
                  className={`admin-documents-chip${!filters.eventType ? " is-active" : ""}`}
                >
                  All
                </Link>
                {eventTypes.map((value) => (
                  <Link
                    key={value}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextEventType: value })}
                    className={`admin-documents-chip${filters.eventType === value ? " is-active" : ""}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-reference-filter-group">
              <p>Source</p>
              <div className="admin-documents-chip-row">
                <Link
                  href={buildCrmLeadsHref({ state: crmLeadsState, nextSource: "" })}
                  className={`admin-documents-chip${!filters.source ? " is-active" : ""}`}
                >
                  All
                </Link>
                {sources.map((value) => (
                  <Link
                    key={value}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextSource: value })}
                    className={`admin-documents-chip${filters.source === value ? " is-active" : ""}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
            <div className="admin-reference-filter-group">
              <p>Owner</p>
              <div className="admin-documents-chip-row">
                <Link
                  href={buildCrmLeadsHref({ state: crmLeadsState, nextOwner: "" })}
                  className={`admin-documents-chip${!filters.owner ? " is-active" : ""}`}
                >
                  All
                </Link>
                {owners.map((value) => (
                  <Link
                    key={value}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextOwner: value })}
                    className={`admin-documents-chip${filters.owner === value ? " is-active" : ""}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-reference-filter-split" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-reference-filter-group">
              <p>Next action</p>
              <div className="admin-documents-chip-row">
                {nextActionOptions.map((option) => (
                  <Link
                    key={option.value || "all"}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextAction: option.value })}
                    className={`admin-documents-chip${(filters.nextAction ?? "") === option.value ? " is-active" : ""}`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="admin-reference-filter-group">
              <p>Date range</p>
              <div className="admin-documents-chip-row">
                {dateRangeOptions.map((option) => (
                  <Link
                    key={option.value || "all"}
                    href={buildCrmLeadsHref({ state: crmLeadsState, nextDateRange: option.value })}
                    className={`admin-documents-chip${(filters.dateRange ?? "") === option.value ? " is-active" : ""}`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <label
            className={`admin-reference-filter-group${followUpFilterActive ? " admin-filter-field--active" : ""}`}
            style={{ gridColumn: "1 / -1" }}
          >
            <p>Follow-up</p>
            <div className="admin-documents-chip-row">
              <Link
                href={buildCrmLeadsHref({ state: crmLeadsState, nextFollowUp: "" })}
                className={`admin-documents-chip${!filters.followUp ? " is-active" : ""}`}
              >
                All
              </Link>
              <Link
                href={buildCrmLeadsHref({ state: crmLeadsState, nextFollowUp: "with_inspiration" })}
                className={`admin-documents-chip${filters.followUp === "with_inspiration" ? " is-active" : ""}`}
              >
                Has follow-up inspiration
              </Link>
            </div>
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
                      <CrmLeadRowActions
                        lead={lead}
                        unmatchedReplyCandidateCount={unmatchedReplyCandidateCount}
                        unmatchedReplyReviewHref={unmatchedReplyReviewHref}
                      />
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
