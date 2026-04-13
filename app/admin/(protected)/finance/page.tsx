import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Finance</p>
          <h1>Income and expense tracking</h1>
          <p className="lead">
            Keep finance visible in one place so deposits, receipts, outstanding balances,
            and upcoming expense tracking stay easy to review.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Income workspace</span>
          <span className="admin-head-pill">Expenses ready next</span>
        </div>
      </div>

      <div className="admin-workspace-tabs admin-workspace-tabs--inline">
        <Link href="/admin/finance" className={`admin-workspace-tab${tab === "overview" ? " is-active" : ""}`}>
          Overview
        </Link>
        <Link href="/admin/finance?tab=income" className={`admin-workspace-tab${tab === "income" ? " is-active" : ""}`}>
          Income
        </Link>
        <Link href="/admin/finance?tab=expenses" className={`admin-workspace-tab${tab === "expenses" ? " is-active" : ""}`}>
          Expenses
        </Link>
      </div>

      <section className="admin-mini-report">
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Recorded income</p>
            <strong>$0</strong>
            <span>Ready to populate from invoices and receipts</span>
          </div>
          <div className="card metric-card metric-card--amber">
            <p className="muted">Outstanding deposits</p>
            <strong>0</strong>
            <span>Deposit follow-up stays visible here</span>
          </div>
          <div className="card metric-card metric-card--green">
            <p className="muted">Paid receipts</p>
            <strong>0</strong>
            <span>Receipts will roll into finance reporting</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Tracked expenses</p>
            <strong>0</strong>
            <span>Vendor and production costs can be added next</span>
          </div>
        </div>
      </section>

      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <section className="card admin-section-card">
          <div className="admin-section-title">
            <h3>{tab === "expenses" ? "Expense tracking roadmap" : "Finance overview"}</h3>
            <p className="muted">
              {tab === "expenses"
                ? "This section is ready for expense entries, vendor payouts, and cost reporting."
                : "Use this workspace to consolidate invoice payments, receipts, deposits, and future expenses."}
            </p>
          </div>
          <div className="admin-placeholder-list">
            <div>
              <strong>Income ledger</strong>
              <span>Payments recorded from invoices and receipts</span>
            </div>
            <div>
              <strong>Expense ledger</strong>
              <span>Vendor costs, rentals, and production expenses</span>
            </div>
            <div>
              <strong>Monthly reporting</strong>
              <span>Revenue, deposits, balances, and operating outflow</span>
            </div>
          </div>
        </section>

        <aside className="card admin-section-card">
          <div className="admin-section-title">
            <h3>Next setup</h3>
            <p className="muted">These controls keep finance ready without removing your current workflow.</p>
          </div>
          <div className="admin-mini-metrics admin-mini-metrics--plain">
            <div>
              <strong>Invoices</strong>
              <span>Already connected through the document system</span>
            </div>
            <div>
              <strong>Receipts</strong>
              <span>Available for income confirmation</span>
            </div>
            <div>
              <strong>Expenses</strong>
              <span>Planned next for deeper cost tracking</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
