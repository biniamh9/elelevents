import Link from "next/link";
import CrmKpiGrid from "@/components/admin/crm-kpi-grid";
import CrmPipelineBoard from "@/components/admin/crm-pipeline-board";
import CrmInteractionsFeed from "@/components/admin/crm-interactions-feed";
import CrmLeadsTable from "@/components/admin/crm-leads-table";
import {
  CRM_STAGE_LABELS,
  crmInteractions,
  crmLeads,
  crmRevenueTrend,
  crmSourceMetrics,
  crmTasks,
  type CrmLead,
} from "@/lib/crm-analytics";

export const dynamic = "force-dynamic";

type Tab = "overview" | "leads" | "customers" | "revenue" | "tasks";

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
  const activeTab: Tab = ["overview", "leads", "customers", "revenue", "tasks"].includes(params.tab ?? "")
    ? (params.tab as Tab)
    : "overview";

  const filteredLeads = filterLeads(crmLeads, params);
  const leadsById = new Map(crmLeads.map((lead) => [lead.id, lead]));
  const totalBookedRevenue = crmLeads
    .filter((lead) => lead.stage === "booked")
    .reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const totalOutstanding = crmLeads
    .filter((lead) => lead.stage === "awaiting_deposit" || lead.stage === "quote_sent")
    .reduce((sum, lead) => sum + lead.estimatedValue * 0.3, 0);
  const hotLeads = crmLeads.filter((lead) =>
    ["consultation_scheduled", "consultation_completed", "quote_sent", "awaiting_deposit"].includes(lead.stage)
  ).length;
  const quotesSent = crmLeads.filter((lead) => lead.stage === "quote_sent").length;
  const conversionRate = Math.round(
    (crmLeads.filter((lead) => lead.stage === "booked").length / crmLeads.length) * 100
  );

  const kpis = [
    { label: "Active Leads", value: String(crmLeads.length), detail: "Open relationships across inquiry to booking", tone: "neutral" as const },
    { label: "Hot Leads", value: String(hotLeads), detail: "Needs timely follow-up this week", tone: "amber" as const },
    { label: "Quotes Sent", value: String(quotesSent), detail: "Currently under client review", tone: "violet" as const },
    { label: "Conversion Rate", value: `${conversionRate}%`, detail: "Inquiry to booked this cycle", tone: "blue" as const },
    { label: "Booked Pipeline Value", value: formatMoney(totalBookedRevenue), detail: "Confirmed event value associated with booked leads", tone: "green" as const },
    { label: "Deposits Pending", value: formatMoney(Math.round(totalOutstanding)), detail: "Open deposit follow-up still tied to pipeline movement", tone: "red" as const },
  ];

  const stageCounts = Object.entries(CRM_STAGE_LABELS).map(([stage, label]) => ({
    label,
    count: crmLeads.filter((lead) => lead.stage === stage).length,
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
            Track customer relationships, pipeline movement, follow-up health, and booking momentum.
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
        <Link href="/admin/crm-analytics" className={`admin-workspace-tab${activeTab === "overview" ? " is-active" : ""}`}>Overview</Link>
        <Link href="/admin/crm-analytics?tab=leads" className={`admin-workspace-tab${activeTab === "leads" ? " is-active" : ""}`}>Leads</Link>
        <Link href="/admin/crm-analytics?tab=customers" className={`admin-workspace-tab${activeTab === "customers" ? " is-active" : ""}`}>Customers</Link>
        <Link href="/admin/crm-analytics?tab=revenue" className={`admin-workspace-tab${activeTab === "revenue" ? " is-active" : ""}`}>Revenue Signals</Link>
        <Link href="/admin/crm-analytics?tab=tasks" className={`admin-workspace-tab${activeTab === "tasks" ? " is-active" : ""}`}>Tasks</Link>
      </div>

      <CrmKpiGrid items={kpis} />

      {activeTab === "overview" ? (
        <>
          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <section className="card admin-section-card admin-panel admin-panel--wide">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Pipeline funnel</p>
                  <h3>Stage distribution</h3>
                </div>
              </div>
              <div className="crm-stage-list">
                {stageCounts.map((stage) => (
                  <div key={stage.label} className="crm-stage-row">
                    <strong>{stage.label}</strong>
                    <span>{stage.count}</span>
                  </div>
                ))}
              </div>
            </section>

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

          <div className="admin-dashboard-row">
            <CrmLeadsTable leads={filteredLeads.slice(0, 4)} filters={{}} />
            <CrmInteractionsFeed items={crmInteractions} leadsById={leadsById} />
          </div>

          <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
            <section className="card admin-section-card admin-panel admin-panel--wide">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Revenue trend</p>
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
                  <p className="eyebrow">Source performance</p>
                  <h3>Lead sources</h3>
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
        </>
      ) : null}

      {activeTab === "leads" ? (
        <div className="admin-dashboard-row admin-dashboard-row--crm-leads">
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
