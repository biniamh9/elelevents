import Link from "next/link";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage("finance");

  const { tab = "overview" } = await searchParams;

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Finance"
        description="Review actual cash movement, collected deposits, receipts, outstanding balances, and expense tracking in one accounting-focused workspace."
      />

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

      <AdminMetricStrip
        items={[
          { label: "Recorded income", value: "$0", note: "Recognized cash from invoices and receipts" },
          { label: "Outstanding deposits", value: 0, note: "Payment obligations still open in finance", tone: "amber" },
          { label: "Paid receipts", value: 0, note: "Confirmed receipts recognized in cash tracking", tone: "green" },
          { label: "Tracked expenses", value: 0, note: "Vendor and production costs can be tracked next" },
        ]}
      />

      <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
        <section className="card admin-section-card">
          <AdminSectionHeader
            title={tab === "expenses" ? "Expense tracking roadmap" : "Finance overview"}
            description={
              tab === "expenses"
                ? "This section is ready for expense entries, vendor payouts, and cost reporting."
                : "Use this workspace to consolidate actual payments, receipts, deposits, and future expenses."
            }
          />
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
          <AdminSectionHeader
            title="Next setup"
            description="These controls keep finance ready without removing your current workflow."
          />
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
