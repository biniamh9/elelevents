import Link from "next/link";
import CrmForecastCard from "@/components/admin/crm-forecast-card";
import CrmFunnelCard from "@/components/admin/crm-funnel-card";
import CrmReportFilters from "@/components/admin/crm-report-filters";
import CrmTeamPerformanceTable from "@/components/admin/crm-team-performance-table";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { requireAdminPage } from "@/lib/auth/admin";
import { buildCrmWorkspaceHref } from "@/lib/admin-navigation";
import {
  filterCrmLeads,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLikelyRevenue,
  getLostReasonMetrics,
  getPipelineStageCounts,
  getPipelineValue,
  getSourceMetrics,
} from "@/lib/crm-analytics";
import {
  buildRevenueTrend,
  buildTeamPerformance,
  getLiveCrmMetrics,
} from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

export default async function AdminCrmReportsRoute({
  searchParams,
}: {
  searchParams: Promise<{
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
  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const filteredLeads = filterCrmLeads(crmMetrics.leads, params);

  const totalBookedRevenue = getBookedRevenue(filteredLeads);
  const totalPipelineValue = getPipelineValue(filteredLeads);
  const forecastedRevenue = getForecastedRevenue(filteredLeads);
  const likelyRevenue = getLikelyRevenue(filteredLeads);
  const conversionRate = getConversionRate(filteredLeads);
  const stageCounts = getPipelineStageCounts(filteredLeads);
  const revenueTrend = buildRevenueTrend(filteredLeads);
  const teamPerformance = buildTeamPerformance(filteredLeads);
  const filteredSourceMetrics = getSourceMetrics(filteredLeads);
  const filteredLostReasonMetrics = getLostReasonMetrics(filteredLeads);
  const funnelItems = stageCounts.map((stage, index, all) => ({
    label: stage.label,
    count: stage.count,
    dropoff:
      index === 0 || all[index - 1].count === 0
        ? "Entry volume"
        : `${Math.max(0, all[index - 1].count - stage.count)} dropped from prior stage`,
  }));

  const exportParams = new URLSearchParams();
  exportParams.set("tab", "reports");
  if (params.q) exportParams.set("q", params.q);
  if (params.stage) exportParams.set("stage", params.stage);
  if (params.eventType) exportParams.set("eventType", params.eventType);
  if (params.source) exportParams.set("source", params.source);
  if (params.owner) exportParams.set("owner", params.owner);
  if (params.nextAction) exportParams.set("nextAction", params.nextAction);
  if (params.dateRange) exportParams.set("dateRange", params.dateRange);
  if (params.followUp) exportParams.set("followUp", params.followUp);
  const exportHref = `/api/admin/crm-analytics/export?${exportParams.toString()}`;

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>CRM Reports</h1>
          <p>Use this route for lifecycle analytics, conversion reporting, and forecast signals without mixing it into day-to-day pipeline execution.</p>
        </div>
        <div className="admin-page-head-aside">
          <a href={exportHref} className="admin-head-pill">Export report</a>
          <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-head-pill">Open pipeline</Link>
          <Link href={buildCrmWorkspaceHref("tasks")} className="admin-head-pill">Open tasks</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          This route is dedicated to insight reporting only. Pipeline execution, follow-up, and customer handling stay in their own CRM workspaces.
        </p>
      </section>

      <div className="admin-workspace-tabs admin-workspace-tabs--inline admin-reference-tabs">
        <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-workspace-tab">Pipeline</Link>
        <Link href={buildCrmWorkspaceHref("leads")} className="admin-workspace-tab">Leads / Inquiries</Link>
        <Link href={buildCrmWorkspaceHref("customers")} className="admin-workspace-tab">Customers</Link>
        <Link href={buildCrmWorkspaceHref("tasks")} className="admin-workspace-tab">Tasks</Link>
        <Link href={buildCrmWorkspaceHref("reports")} className="admin-workspace-tab is-active">Reports</Link>
      </div>

      <div className="summary-pills">
        <span className="summary-chip">Filtered leads: {filteredLeads.length}</span>
        <span className="summary-chip">Conversion: {conversionRate}%</span>
        <span className="summary-chip">Booked revenue: {formatMoney(totalBookedRevenue)}</span>
        <span className="summary-chip">Forecast: {formatMoney(forecastedRevenue)}</span>
      </div>

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
    </main>
  );
}
