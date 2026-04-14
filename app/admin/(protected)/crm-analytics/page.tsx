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
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLikelyRevenue,
  getOutstandingBalances,
  getPipelineStageCounts,
  getPipelineValue,
  type CrmLead,
} from "@/lib/crm-analytics";

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

function filterLeads(
  leads: CrmLead[],
  filters: {
    q?: string;
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    dateRange?: string;
  }
) {
  return leads.filter((lead) => {
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const haystack = `${lead.clientName} ${lead.email} ${lead.venue}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.eventType && lead.eventType !== filters.eventType) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.owner && lead.owner !== filters.owner) return false;
    if (filters.dateRange) {
      const days = Number(filters.dateRange);
      const diff = (new Date(lead.eventDate).getTime() - Date.now()) / 86400000;
      if (Number.isFinite(days) && diff > days) return false;
    }
    return true;
  });
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

  const filteredLeads = filterLeads(crmLeads, params);
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
    overdue: crmTasks.filter((task) => task.status === "overdue").length,
    today: crmTasks.filter((task) => task.status === "today").length,
    awaitingReply: crmTasks.filter((task) => task.status === "awaiting_reply").length,
    deposits: crmTasks.filter((task) => task.status === "deposit").length,
    contracts: crmTasks.filter((task) => task.status === "contract").length,
  };

  return (
    <main className="admin-page section admin-page--workspace">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">CRM &amp; Analytics</p>
          <h1>CRM &amp; Analytics</h1>
          <p className="lead">
            Track customer relationships, pipeline movement, conversion health, sales forecasting, and booking momentum.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/documents" className="admin-topbar-pill">
            Export report
          </Link>
          <Link href="/admin/crm-analytics?tab=leads" className="admin-topbar-pill">
            Add interaction
          </Link>
          <Link href="/admin/crm-analytics?tab=tasks" className="btn">
            Create task
          </Link>
        </div>
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
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Follow-up queue</p>
                  <h3>Needs action</h3>
                </div>
              </div>
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

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <section className="card admin-section-card admin-panel admin-panel--wide">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Revenue by month</p>
                  <h3>Monthly booked revenue</h3>
                </div>
              </div>
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
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Lead source report</p>
                  <h3>Conversion by source</h3>
                </div>
              </div>
              <div className="crm-source-list">
                {crmSourceMetrics.map((item) => (
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

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <CrmTeamPerformanceTable items={crmTeamPerformance} />
            <section className="card admin-section-card admin-panel">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Lost lead reasons</p>
                  <h3>Why opportunities were lost</h3>
                </div>
              </div>
              <div className="crm-source-list">
                {crmLostReasonMetrics.map((item) => (
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
          />
          <CrmInteractionsFeed items={crmInteractions} leadsById={leadsById} />
        </div>
      ) : null}

      {activeTab === "customers" ? (
        <section className="card admin-section-card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Customers</p>
              <h3>Relationship roster</h3>
            </div>
          </div>
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
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Revenue signals</p>
                <h3>Booked pipeline trend</h3>
              </div>
            </div>
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
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Source performance</p>
                <h3>Lead source contribution</h3>
              </div>
            </div>
            <div className="crm-source-list">
              {crmSourceMetrics.map((item) => (
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
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Tasks</p>
                <h3>Follow-up queue</h3>
              </div>
            </div>
            <div className="crm-task-list">
              {crmTasks.map((task) => {
                const lead = leadsById.get(task.leadId);
                return (
                  <Link key={task.id} href={`/admin/crm-analytics/${task.leadId}`} className="crm-task-row">
                    <div>
                      <strong>{task.title}</strong>
                      <span>{lead ? `${lead.clientName} · ${lead.eventType}` : "Lead"}</span>
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
