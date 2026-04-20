import Link from "next/link";
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
import {
  CRM_STAGE_LABELS,
  crmDashboardAlerts,
  crmInteractions,
  crmLeads,
  crmLostReasonMetrics,
  crmRevenueTrend,
  crmSourceMetrics,
  crmTeamPerformance,
  crmTasks,
  filterCrmLeads,
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLikelyRevenue,
  getLostReasonMetrics,
  getOutstandingBalances,
  getPipelineStageCounts,
  getPipelineValue,
  getSourceMetrics,
  type CrmLead,
} from "@/lib/crm-analytics";
import { getPersistedCrmTasks } from "@/lib/crm-follow-up-tasks";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

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

function getTaskPriority(task: { status: string; title: string }) {
  if (task.title.toLowerCase().includes("revise quote")) return 0;
  if (task.status === "overdue") return 1;
  if (task.status === "today") return 2;
  if (task.status === "contract") return 3;
  if (task.status === "deposit") return 4;
  if (task.status === "awaiting_reply") return 5;
  return 6;
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
    dateRange?: string;
  }>;
}) {
  const params = await searchParams;
  const activeTab: Tab = ["dashboard", "reports", "leads", "customers", "revenue", "tasks"].includes(params.tab ?? "")
    ? (params.tab as Tab)
    : "dashboard";

  const filteredLeads = filterCrmLeads(crmLeads, params);
  const persistedTasks = await getPersistedCrmTasks(supabaseAdmin, { status: "open" });
  const combinedTasks = [...persistedTasks, ...crmTasks].sort((a, b) => {
    const priorityDiff = getTaskPriority(a) - getTaskPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });
  const revisionLeadIds = new Set(
    combinedTasks
      .filter((task) => task.title.toLowerCase().includes("revise quote"))
      .map((task) => task.leadId)
  );
  const leadsById = new Map(crmLeads.map((lead) => [lead.id, lead]));
  const totalBookedRevenue = getBookedRevenue(crmLeads);
  const totalPipelineValue = getPipelineValue(crmLeads);
  const forecastedRevenue = getForecastedRevenue(crmLeads);
  const likelyRevenue = getLikelyRevenue(crmLeads);
  const totalOutstanding = getOutstandingBalances(crmLeads);
  const hotLeads = crmLeads.filter((lead) =>
    ["consultation_scheduled", "consultation_completed", "quote_sent", "awaiting_deposit"].includes(lead.stage)
  ).length;
  const quotesSent = crmLeads.filter((lead) => lead.stage === "quote_sent").length;
  const conversionRate = getConversionRate(crmLeads);
  const averageEventValue = getAverageEventValue(crmLeads);
  const activeOpportunities = crmLeads.filter((lead) => !["booked", "lost"].includes(lead.stage)).length;
  const filteredSourceMetrics = getSourceMetrics(filteredLeads);
  const filteredLostReasonMetrics = getLostReasonMetrics(filteredLeads);
  const workflowColumns = buildWorkflowColumnsFromCrmLeads(crmLeads, {
    revisionLeadIds,
  });

  const exportParams = new URLSearchParams();
  exportParams.set("tab", activeTab);
  if (params.q) exportParams.set("q", params.q);
  if (params.stage) exportParams.set("stage", params.stage);
  if (params.eventType) exportParams.set("eventType", params.eventType);
  if (params.source) exportParams.set("source", params.source);
  if (params.owner) exportParams.set("owner", params.owner);
  if (params.dateRange) exportParams.set("dateRange", params.dateRange);
  const exportHref = `/api/admin/crm-analytics/export?${exportParams.toString()}`;

  const kpis = [
    { label: "Active Leads", value: String(crmLeads.length), detail: "Open relationships across inquiry to booking", tone: "neutral" as const },
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

  const stageCounts = getPipelineStageCounts(crmLeads);
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
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`admin-workflow-lane-item${item.attention ? " admin-workflow-lane-item--attention" : ""}`}
                        >
                          <strong>{item.title}</strong>
                          <span>{item.subtitle}</span>
                          {item.attention ? <small>{item.attention}</small> : null}
                        </Link>
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
            <CrmAlertsPanel items={crmDashboardAlerts} />
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmFunnelCard items={funnelItems} />
            <section className="card admin-section-card admin-panel">
              <AdminSectionHeader eyebrow="Follow-up queue" title="Needs action" />
              <div className="admin-mini-metrics admin-mini-metrics--plain">
                <div><strong>{followupCounts.overdue}</strong><span>Overdue follow-ups</span></div>
                <div><strong>{followupCounts.today}</strong><span>Due today</span></div>
                <div><strong>{followupCounts.awaitingReply}</strong><span>Awaiting client reply</span></div>
                <div><strong>{followupCounts.deposits}</strong><span>Unpaid deposits</span></div>
                <div><strong>{followupCounts.contracts}</strong><span>Unsigned contracts</span></div>
              </div>
            </section>
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmInteractionsFeed items={crmInteractions} leadsById={leadsById} />
            <CrmUpcomingEventsPanel items={crmLeads.filter((lead) => lead.stage === "booked")} />
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
                {crmRevenueTrend.map((point) => (
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
            <CrmTeamPerformanceTable items={crmTeamPerformance} />
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
            filters={{
              q: params.q,
              stage: params.stage,
              eventType: params.eventType,
              source: params.source,
              owner: params.owner,
              dateRange: params.dateRange,
            }}
            revisionLeadIds={revisionLeadIds}
          />
          <CrmInteractionsFeed items={crmInteractions} leadsById={leadsById} />
        </div>
      ) : null}

      {activeTab === "customers" ? (
        <section className="card admin-section-card admin-panel admin-panel--wide">
          <AdminSectionHeader eyebrow="Customers" title="Relationship roster" />
          <div className="crm-customer-grid">
            {crmLeads.map((lead) => (
              <Link key={lead.id} href={`/admin/crm-analytics/${lead.id}`} className="crm-customer-card">
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
              {crmRevenueTrend.map((point) => (
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
                return (
                  <Link key={task.id} href={`/admin/crm-analytics/${task.leadId}`} className="crm-task-row">
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.detail || (lead ? `${lead.clientName} · ${lead.eventType}` : "Lead")}</span>
                    </div>
                    <small>{task.dueLabel}</small>
                  </Link>
                );
              })}
            </div>
          </section>
          <CrmInteractionsFeed items={crmInteractions} leadsById={leadsById} />
        </div>
      ) : null}
    </main>
  );
}
