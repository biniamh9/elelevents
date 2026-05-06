import Link from "next/link";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import CrmAlertsPanel from "@/components/admin/crm-alerts-panel";
import CrmForecastCard from "@/components/admin/crm-forecast-card";
import CrmFunnelCard from "@/components/admin/crm-funnel-card";
import CrmInteractionsFeed from "@/components/admin/crm-interactions-feed";
import CrmKpiGrid from "@/components/admin/crm-kpi-grid";
import CrmUpcomingEventsPanel from "@/components/admin/crm-upcoming-events-panel";
import { buildWorkflowColumnsFromCrmLeads } from "@/lib/admin-workflow-lane";
import { requireAdminPage } from "@/lib/auth/admin";
import { buildCrmWorkspaceHref } from "@/lib/admin-navigation";
import {
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLeadTemperature,
  getLikelyRevenue,
  getPipelineStageCounts,
  getPipelineValue,
} from "@/lib/crm-analytics";
import {
  buildDashboardAlerts,
  buildRevenueTrend,
  getLiveCrmMetrics,
} from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getUnmatchedInboundReplies } from "@/lib/unmatched-inbound-replies";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

export async function CrmPipelinePage() {
  await requireAdminPage("crm");

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const pendingUnmatchedReplies = await getUnmatchedInboundReplies({
    reviewStatus: "pending_review",
    limit: 12,
  });
  const revisionLeadIds = new Set(
    crmMetrics.tasks
      .filter((task) => task.title.toLowerCase().includes("revise quote"))
      .map((task) => task.leadId)
  );
  const leadsById = new Map(crmMetrics.leads.map((lead) => [lead.id, lead]));
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
  const workflowColumns = buildWorkflowColumnsFromCrmLeads(crmMetrics.leads, {
    revisionLeadIds,
  });
  const revenueTrend = buildRevenueTrend(crmMetrics.leads);
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
    dropoff:
      index === 0 || all[index - 1].count === 0
        ? "Entry volume"
        : `${Math.max(0, all[index - 1].count - stage.count)} dropped from prior stage`,
  }));
  const followupCounts = {
    overdue: crmMetrics.tasks.filter((task) => task.status === "overdue").length,
    today: crmMetrics.tasks.filter((task) => task.status === "today").length,
    awaitingReply: crmMetrics.tasks.filter((task) => task.status === "awaiting_reply").length,
    deposits: crmMetrics.tasks.filter((task) => task.status === "deposit").length,
    contracts: crmMetrics.tasks.filter((task) => task.status === "contract").length,
    replyReview: pendingUnmatchedReplies.length,
  };

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>CRM Pipeline</h1>
          <p>Track customer relationships, stage movement, next actions, contract readiness, and deposit follow-through from one canonical lifecycle workspace.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("leads")} className="admin-head-pill">Open leads</Link>
          <Link href={buildCrmWorkspaceHref("customers")} className="admin-head-pill">Open customers</Link>
          <Link href={buildCrmWorkspaceHref("tasks")} className="admin-head-pill">Open tasks</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Use pipeline as the source of truth for inquiry-to-booked movement. Customer accounts, projects, tasks, and reports now have their own routes and no longer share this pipeline renderer.
        </p>
      </section>

      <div className="admin-workspace-tabs admin-workspace-tabs--inline admin-reference-tabs">
        <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-workspace-tab is-active">Pipeline</Link>
        <Link href={buildCrmWorkspaceHref("leads")} className="admin-workspace-tab">Leads / Inquiries</Link>
        <Link href={buildCrmWorkspaceHref("customers")} className="admin-workspace-tab">Customers</Link>
        <Link href={buildCrmWorkspaceHref("tasks")} className="admin-workspace-tab">Tasks</Link>
        <Link href={buildCrmWorkspaceHref("reports")} className="admin-workspace-tab">Reports</Link>
      </div>

      <CrmKpiGrid items={kpis} />

      <section className="card admin-section-card admin-panel admin-panel--wide">
        <AdminSectionHeader
          eyebrow="Canonical CRM pipeline"
          title="Lead lifecycle from inquiry to booked event"
          description="This is the source of truth for stage movement, ownership, next actions, contract readiness, and deposit follow-through."
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
                        <Link href={item.primaryAction.href} className="admin-workflow-lane-next-action">
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
        <CrmAlertsPanel items={dashboardAlerts} />
      </div>

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
        <CrmInteractionsFeed items={crmMetrics.interactions.slice(0, 12)} leadsById={leadsById} />
        <CrmUpcomingEventsPanel items={crmMetrics.leads.filter((lead) => lead.stage === "booked")} />
      </div>
    </main>
  );
}
