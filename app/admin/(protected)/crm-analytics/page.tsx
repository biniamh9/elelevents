import Link from "next/link";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { buildCrmLeadDetailHref, buildCrmLeadsHref } from "@/lib/admin-navigation";
import CrmAlertsPanel from "@/components/admin/crm-alerts-panel";
import CrmForecastCard from "@/components/admin/crm-forecast-card";
import CrmFunnelCard from "@/components/admin/crm-funnel-card";
import CrmKpiGrid from "@/components/admin/crm-kpi-grid";
import CrmInteractionsFeed from "@/components/admin/crm-interactions-feed";
import CrmLeadsTable from "@/components/admin/crm-leads-table";
import CrmReportFilters from "@/components/admin/crm-report-filters";
import CrmTeamPerformanceTable from "@/components/admin/crm-team-performance-table";
import CrmUpcomingEventsPanel from "@/components/admin/crm-upcoming-events-panel";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { buildWorkflowColumnsFromCrmLeads } from "@/lib/admin-workflow-lane";
import { buildUnmatchedReplyReviewHref } from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import {
  filterCrmLeads,
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLeadTemperature,
  getLikelyRevenue,
  getLostReasonMetrics,
  getPipelineStageCounts,
  getPipelineValue,
  sortCrmLeadsByActionReadiness,
  getSourceMetrics,
  type CrmTask,
} from "@/lib/crm-analytics";
import {
  buildDashboardAlerts,
  buildRevenueTrend,
  buildTeamPerformance,
  getLiveCrmMetrics,
} from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  getStrongUnmatchedReplyCandidatesByInquiry,
  getUnmatchedInboundReplies,
} from "@/lib/unmatched-inbound-replies";

export const dynamic = "force-dynamic";

type Tab = "dashboard" | "reports" | "leads" | "customers" | "revenue" | "tasks";

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getTaskPriority(task: Pick<CrmTask, "status" | "title" | "entityType">) {
  if (task.entityType === "unmatched_reply") return 0;
  if (task.entityType === "rental_request") return 0;
  if (task.title.toLowerCase().includes("revise quote")) return 1;
  if (task.status === "overdue") return 2;
  if (task.status === "today") return 3;
  if (task.status === "contract") return 4;
  if (task.status === "deposit") return 5;
  if (task.status === "awaiting_reply") return 6;
  return 7;
}

function getTaskActionTone(task: Pick<CrmTask, "status" | "title" | "entityType">) {
  const title = task.title.toLowerCase();

  if (task.entityType === "unmatched_reply") {
    return "email" as const;
  }

  if (task.entityType === "rental_request") {
    if (task.status === "awaiting_reply") return "email" as const;
    return "record" as const;
  }

  if (title.includes("reply") || task.status === "awaiting_reply") {
    return "email" as const;
  }

  if (title.includes("deposit") || task.status === "deposit" || task.status === "contract") {
    return "record" as const;
  }

  return "internal" as const;
}

export default async function AdminCrmAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    nextAction?: string;
    dateRange?: string;
    followUp?: string;
  }>;
}) {
  await requireAdminPage("crm");

  const params = await searchParams;
  const activeTab: Tab = ["dashboard", "reports", "leads", "customers", "revenue", "tasks"].includes(params.tab ?? "")
    ? (params.tab as Tab)
    : "dashboard";

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const pendingUnmatchedReplies = await getUnmatchedInboundReplies({
    reviewStatus: "pending_review",
    limit: 12,
  });
  const unmatchedReplyCandidatesByInquiry =
    await getStrongUnmatchedReplyCandidatesByInquiry(
      crmMetrics.leads.map((lead) => ({
        id: lead.id,
        email: lead.email,
      }))
    );
  const baseFilteredLeads = filterCrmLeads(crmMetrics.leads, params);
  const filteredLeadIds = new Set(baseFilteredLeads.map((lead) => lead.id));
  const filteredInteractions = crmMetrics.interactions.filter((item) =>
    filteredLeadIds.has(item.leadId)
  );
  const leadBoundTasks = crmMetrics.tasks.filter((task) => filteredLeadIds.has(task.leadId));
  const unmatchedReplyTasks: CrmTask[] = pendingUnmatchedReplies.map((reply) => ({
    id: `unmatched-reply-${reply.id}`,
    leadId: reply.id,
    title: "Review unmatched reply",
    status: "today",
    dueLabel: "Manual reply review pending",
    detail: `${reply.from_email} · ${reply.subject?.trim() || "No subject"}`,
    href: buildUnmatchedReplyReviewHref({
      status: "pending_review",
      replyId: reply.id,
    }),
    entityType: "unmatched_reply",
  }));
  const combinedTasks = [...unmatchedReplyTasks, ...leadBoundTasks].sort((a, b) => {
    const priorityDiff = getTaskPriority(a) - getTaskPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });
  const revisionLeadIds = new Set(
    combinedTasks
      .filter((task) => task.title.toLowerCase().includes("revise quote"))
      .map((task) => task.leadId)
  );
  const leadsById = new Map(crmMetrics.leads.map((lead) => [lead.id, lead]));
  const unmatchedReplyCandidateCounts = Object.fromEntries(
    crmMetrics.leads.map((lead) => [
      lead.id,
      unmatchedReplyCandidatesByInquiry[lead.id]?.length ?? 0,
    ])
  );
  const unmatchedReplyReviewHrefs = Object.fromEntries(
    crmMetrics.leads.map((lead) => [
      lead.id,
      buildUnmatchedReplyReviewHref({
        status: "pending_review",
        replyId: unmatchedReplyCandidatesByInquiry[lead.id]?.[0]?.replyId ?? null,
      }),
    ])
  );
  const filteredLeads = sortCrmLeadsByActionReadiness(baseFilteredLeads, {
    revisionLeadIds,
    unmatchedReplyCandidateCounts,
  });
  const totalBookedRevenue = getBookedRevenue(crmMetrics.leads);
  const totalPipelineValue = getPipelineValue(crmMetrics.leads);
  const forecastedRevenue = getForecastedRevenue(crmMetrics.leads);
  const likelyRevenue = getLikelyRevenue(crmMetrics.leads);
  const totalOutstanding = crmMetrics.totals.outstandingBalances;
  const activeLeads = crmMetrics.leads.filter((lead) => lead.stage !== "lost").length;
  const hotLeads = crmMetrics.leads.filter((lead) => getLeadTemperature(lead) === "hot").length;
  const quotesSent = crmMetrics.leads.filter((lead) => lead.stage === "quote_sent").length;
  const conversionRate = getConversionRate(crmMetrics.leads);
  const averageEventValue = getAverageEventValue(crmMetrics.leads);
  const activeOpportunities = crmMetrics.leads.filter((lead) => !["booked", "lost"].includes(lead.stage)).length;
  const filteredSourceMetrics = getSourceMetrics(filteredLeads);
  const filteredLostReasonMetrics = getLostReasonMetrics(filteredLeads);
  const workflowColumns = buildWorkflowColumnsFromCrmLeads(crmMetrics.leads, {
    revisionLeadIds,
  });
  const revenueTrend = buildRevenueTrend(filteredLeads);
  const teamPerformance = buildTeamPerformance(filteredLeads);
  const dashboardAlerts = [
    ...buildDashboardAlerts(crmMetrics.leads, crmMetrics.tasks),
    {
      id: "crm-alert-unmatched-replies",
      title: "Replies awaiting manual review",
      detail: "Inbound emails were held back because they could not be matched safely to one opportunity.",
      severity: "high" as const,
      count: pendingUnmatchedReplies.length,
    },
  ];

  const exportParams = new URLSearchParams();
  exportParams.set("tab", activeTab);
  if (params.q) exportParams.set("q", params.q);
  if (params.stage) exportParams.set("stage", params.stage);
  if (params.eventType) exportParams.set("eventType", params.eventType);
  if (params.source) exportParams.set("source", params.source);
  if (params.owner) exportParams.set("owner", params.owner);
  if (params.nextAction) exportParams.set("nextAction", params.nextAction);
  if (params.dateRange) exportParams.set("dateRange", params.dateRange);
  if (params.followUp) exportParams.set("followUp", params.followUp);
  const exportHref = `/api/admin/crm-analytics/export?${exportParams.toString()}`;
  const crmLeadsState = {
    q: params.q,
    stage: params.stage,
    eventType: params.eventType,
    source: params.source,
    owner: params.owner,
    nextAction: params.nextAction,
    dateRange: params.dateRange,
    followUp: params.followUp,
  };
  const followUpFilterHref = buildCrmLeadsHref({
    state: crmLeadsState,
    nextFollowUp: "with_inspiration",
  });
  const clearFollowUpFilterHref = buildCrmLeadsHref({
    state: crmLeadsState,
  });

  const kpis = [
    { label: "Active Leads", value: String(activeLeads), detail: "Open relationships across inquiry to booking", tone: "neutral" as const },
    { label: "Hot Leads", value: String(hotLeads), detail: "Needs timely follow-up this week", tone: "amber" as const },
    { label: "Quotes Sent", value: String(quotesSent), detail: "Currently under client review", tone: "violet" as const },
    { label: "Conversion Rate", value: `${conversionRate}%`, detail: "Inquiry to booked this cycle", tone: "blue" as const },
    { label: "Pipeline Value", value: formatMoney(totalPipelineValue), detail: "Open opportunity value across active stages", tone: "neutral" as const },
    { label: "Forecasted Revenue", value: formatMoney(forecastedRevenue), detail: "Weighted projection based on lead temperature", tone: "amber" as const },
    { label: "Booked Revenue", value: formatMoney(totalBookedRevenue), detail: "Confirmed event value associated with booked leads", tone: "green" as const },
    { label: "Outstanding Payments", value: formatMoney(Math.round(totalOutstanding)), detail: "Deposits or balances still open", tone: "red" as const },
    { label: "Average Event Value", value: formatMoney(averageEventValue), detail: "Average value of active opportunities", tone: "blue" as const },
    { label: "Active Opportunities", value: String(activeOpportunities), detail: "Leads still moving through the pipeline", tone: "violet" as const },
  ];

  const stageCounts = getPipelineStageCounts(crmMetrics.leads);
  const funnelItems = stageCounts.map((stage, index, all) => ({
    label: stage.label,
    count: stage.count,
    dropoff: index === 0 || all[index - 1].count === 0
      ? "Entry volume"
      : `${Math.max(0, all[index - 1].count - stage.count)} dropped from prior stage`,
  }));

  const followupCounts = {
    overdue: combinedTasks.filter((task) => task.status === "overdue").length,
    today: combinedTasks.filter((task) => task.status === "today").length,
    awaitingReply: combinedTasks.filter((task) => task.status === "awaiting_reply").length,
    deposits: combinedTasks.filter((task) => task.status === "deposit").length,
    contracts: combinedTasks.filter((task) => task.status === "contract").length,
    replyReview: pendingUnmatchedReplies.length,
  };

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="CRM & Analytics"
        description="Track customer relationships, pipeline movement, conversion health, sales forecasting, and booking momentum."
      />

      <div className="admin-workspace-actions admin-workspace-actions--page">
          <a href={exportHref} className="admin-topbar-pill">
            Export report
          </a>
          <Link href="/admin/crm-analytics?tab=leads" className="admin-topbar-pill">
            Add interaction
          </Link>
          <Link href="/admin/crm-analytics?tab=tasks" className="btn">
            Create task
          </Link>
      </div>

      <div className="admin-workspace-tabs admin-workspace-tabs--inline">
        <Link href="/admin/crm-analytics" className={`admin-workspace-tab${activeTab === "dashboard" ? " is-active" : ""}`}>Dashboard</Link>
        <Link href="/admin/crm-analytics?tab=reports" className={`admin-workspace-tab${activeTab === "reports" ? " is-active" : ""}`}>Reports</Link>
        <Link href="/admin/crm-analytics?tab=leads" className={`admin-workspace-tab${activeTab === "leads" ? " is-active" : ""}`}>Leads</Link>
        <Link href="/admin/crm-analytics?tab=customers" className={`admin-workspace-tab${activeTab === "customers" ? " is-active" : ""}`}>Customers</Link>
        <Link href="/admin/crm-analytics?tab=revenue" className={`admin-workspace-tab${activeTab === "revenue" ? " is-active" : ""}`}>Revenue Signals</Link>
        <Link href="/admin/crm-analytics?tab=tasks" className={`admin-workspace-tab${activeTab === "tasks" ? " is-active" : ""}`}>Tasks</Link>
      </div>

      <CrmKpiGrid items={kpis} />

      {activeTab === "dashboard" ? (
        <>
          <section className="card admin-section-card admin-panel admin-panel--wide">
            <AdminSectionHeader
              eyebrow="Operating lane"
              title="Shared workflow from request to booked event"
              description="Use the same five-stage lane across intake, consultation, quote, contract, and handoff."
            />

            <div className="admin-workflow-lane">
              {workflowColumns.map((column) => (
                <div key={column.key} className="admin-workflow-lane-column">
                  <div className="admin-workflow-lane-head">
                    <div>
                      <span className="eyebrow">{column.label}</span>
                      <p>{column.description}</p>
                    </div>
                    <strong>{column.count}</strong>
                  </div>

                  <div className="admin-workflow-lane-list">
                    {column.items.length ? (
                      column.items.map((item) => (
                        <div
                          key={item.id}
                          className={`admin-workflow-lane-item${item.attention ? " admin-workflow-lane-item--attention" : ""}`}
                        >
                          <Link href={item.href} className="admin-workflow-lane-item-link">
                            <strong>{item.title}</strong>
                            <span>{item.subtitle}</span>
                            {item.attention ? <small>{item.attention}</small> : null}
                          </Link>
                          {item.primaryAction ? (
                            <Link
                              href={item.primaryAction.href}
                              className="admin-workflow-lane-next-action"
                            >
                              <span>Do next</span>
                              <strong>{item.primaryAction.label}</strong>
                            </Link>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="admin-workflow-lane-item admin-workflow-lane-item--empty">
                        <strong>No active records</strong>
                        <span>This stage is currently clear.</span>
                      </div>
                    )}
                  </div>

                  <Link href={column.href} className="admin-topbar-pill">
                    Open {column.label}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmForecastCard
              confirmed={formatMoney(totalBookedRevenue)}
              likely={formatMoney(likelyRevenue)}
              pipeline={formatMoney(totalPipelineValue)}
              forecast={formatMoney(forecastedRevenue)}
            />
            <CrmAlertsPanel items={dashboardAlerts} />
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmFunnelCard items={funnelItems} />
            <section className="card admin-section-card admin-panel">
              <AdminSectionHeader eyebrow="Follow-up queue" title="Needs action" />
              <div className="admin-mini-metrics admin-mini-metrics--plain">
                <div><strong>{followupCounts.overdue}</strong><span>Overdue follow-ups</span></div>
                <div><strong>{followupCounts.today}</strong><span>Due today</span></div>
                <div><strong>{followupCounts.awaitingReply}</strong><span>Awaiting client reply</span></div>
                <div><strong>{followupCounts.replyReview}</strong><span>Reply review</span></div>
                <div><strong>{followupCounts.deposits}</strong><span>Unpaid deposits</span></div>
                <div><strong>{followupCounts.contracts}</strong><span>Unsigned contracts</span></div>
              </div>
            </section>
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmInteractionsFeed items={crmMetrics.interactions.slice(0, 12)} leadsById={leadsById} />
            <CrmUpcomingEventsPanel items={crmMetrics.leads.filter((lead) => lead.stage === "booked")} />
          </div>
        </>
      ) : null}

      {activeTab === "reports" ? (
        <>
          <CrmReportFilters filters={params} />

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmForecastCard
              confirmed={formatMoney(totalBookedRevenue)}
              likely={formatMoney(likelyRevenue)}
              pipeline={formatMoney(totalPipelineValue)}
              forecast={formatMoney(forecastedRevenue)}
            />
            <CrmFunnelCard items={funnelItems} />
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--crm-reports-primary">
            <section className="card admin-section-card admin-panel admin-panel--wide">
              <AdminSectionHeader eyebrow="Revenue by month" title="Monthly booked revenue" />
              <div className="crm-chart">
                {revenueTrend.map((point) => (
                  <div key={point.month} className="crm-chart-bar">
                    <div style={{ height: `${Math.max(18, (point.value / 31400) * 180)}px` }} />
                    <strong>{point.month}</strong>
                    <span>{formatMoney(point.value)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card admin-section-card admin-panel">
              <AdminSectionHeader eyebrow="Lead source report" title="Conversion by source" />
              <div className="crm-source-list">
                {filteredSourceMetrics.map((item) => (
                  <div key={item.source} className="crm-source-row">
                    <div>
                      <strong>{item.source}</strong>
                      <span>{item.leads} leads · {item.booked} booked</span>
                    </div>
                    <small>{item.rate}%</small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="admin-stack admin-stack--crm-reports-secondary">
            <CrmTeamPerformanceTable items={teamPerformance} />
            <section className="card admin-section-card admin-panel admin-panel--wide">
              <AdminSectionHeader eyebrow="Lost lead reasons" title="Why opportunities were lost" />
              <div className="crm-source-list">
                {filteredLostReasonMetrics.map((item) => (
                  <div key={item.reason} className="crm-source-row">
                    <div>
                      <strong>{item.reason}</strong>
                      <span>Lost opportunity report</span>
                    </div>
                    <small>{item.count}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeTab === "leads" ? (
        <div className="admin-stack">
          <CrmLeadsTable
            leads={filteredLeads}
            filters={crmLeadsState}
            revisionLeadIds={revisionLeadIds}
            followUpSummary={{
              pending: crmMetrics.followUpSummary.pending,
              reviewed: crmMetrics.followUpSummary.reviewed,
            }}
            followUpFilterHref={followUpFilterHref}
            clearFollowUpFilterHref={clearFollowUpFilterHref}
            unmatchedReplyCandidateCounts={unmatchedReplyCandidateCounts}
            unmatchedReplyReviewHrefs={unmatchedReplyReviewHrefs}
          />
          <CrmInteractionsFeed items={filteredInteractions.slice(0, 12)} leadsById={leadsById} />
        </div>
      ) : null}

      {activeTab === "customers" ? (
        <section className="card admin-section-card admin-panel admin-panel--wide">
          <AdminSectionHeader eyebrow="Customers" title="Relationship roster" />
          <div className="crm-customer-grid">
            {filteredLeads.map((lead) => (
              <Link key={lead.id} href={buildCrmLeadDetailHref(lead.id)} className="crm-customer-card">
                <strong>{lead.clientName}</strong>
                <span>{lead.eventType} · {formatDate(lead.eventDate)}</span>
                <small>{lead.quoteSummary}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "revenue" ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card admin-panel admin-panel--wide">
            <AdminSectionHeader eyebrow="Revenue signals" title="Booked pipeline trend" />
            <p className="muted">
              CRM shows forecast and booking momentum. Finance remains the source of truth for actual cash, receipts,
              collected deposits, and expenses.
            </p>
            <div className="crm-chart">
              {revenueTrend.map((point) => (
                <div key={point.month} className="crm-chart-bar">
                  <div style={{ height: `${Math.max(18, (point.value / 31400) * 180)}px` }} />
                  <strong>{point.month}</strong>
                  <span>{formatMoney(point.value)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card admin-section-card admin-panel">
            <AdminSectionHeader eyebrow="Source performance" title="Lead source contribution" />
            <div className="crm-source-list">
              {filteredSourceMetrics.map((item) => (
                <div key={item.source} className="crm-source-row">
                  <div>
                    <strong>{item.source}</strong>
                    <span>{item.leads} leads · {item.booked} booked</span>
                  </div>
                  <small>{item.rate}%</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card admin-panel admin-panel--wide">
            <AdminSectionHeader eyebrow="Tasks" title="Follow-up queue" />
            <div className="crm-task-list">
              {combinedTasks.map((task) => {
                const lead = leadsById.get(task.leadId);
                const taskHref = task.href ?? buildCrmLeadDetailHref(task.leadId);
                return (
                  <AdminWorkflowAction
                    key={task.id}
                    href={taskHref}
                    className="crm-task-row admin-workflow-action--menu"
                    tone={getTaskActionTone(task)}
                    label={task.entityType === "rental_request" ? `${task.title} · Rental` : task.title}
                    description={`${task.detail || (lead ? `${lead.clientName} · ${lead.eventType}` : "Lead")} · ${task.dueLabel}`}
                  />
                );
              })}
            </div>
          </section>
            <CrmInteractionsFeed items={filteredInteractions.slice(0, 12)} leadsById={leadsById} />
        </div>
      ) : null}
    </main>
  );
}
