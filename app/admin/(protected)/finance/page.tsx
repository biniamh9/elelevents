import Link from "next/link";
import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import ExpenseManagement from "@/components/forms/admin/expense-management";
import { requireAdminPage } from "@/lib/auth/admin";
import { getFinanceOverview } from "@/lib/finance";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage("finance");

  const { tab = "overview" } = await searchParams;
  const finance = await getFinanceOverview();

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
          {
            label: "Recorded income",
            value: currencyFormatter.format(finance.recordedIncome),
            note: "Recognized cash from invoices and receipts",
            tone: "green",
          },
          {
            label: "Outstanding deposits",
            value: currencyFormatter.format(finance.outstandingDeposits),
            note: `${finance.depositCollectionRate}% deposit collection rate`,
            tone: "amber",
          },
          {
            label: "Paid receipts",
            value: finance.paidReceipts,
            note: "Confirmed receipts recognized in cash tracking",
            tone: "blue",
          },
          {
            label: "Tracked expenses",
            value: currencyFormatter.format(finance.trackedExpenses),
            note: "Vendor and production costs already tracked here",
            tone: "red",
          },
        ]}
      />

      {tab === "overview" ? (
        <div className="admin-dashboard-row admin-dashboard-row--overview-clean">
          <section className="card admin-section-card">
            <AdminSectionHeader
              title="Finance overview"
              description="Use this workspace to consolidate actual payments, receipts, deposits, balances, and operating expenses."
            />
            <div className="admin-placeholder-list">
              <div>
                <strong>Actual money in</strong>
                <span>{currencyFormatter.format(finance.recordedIncome)} recognized from paid invoices and receipts.</span>
              </div>
              <div>
                <strong>Deposit exposure</strong>
                <span>{currencyFormatter.format(finance.outstandingDeposits)} in deposits still awaiting collection.</span>
              </div>
              <div>
                <strong>Open balance risk</strong>
                <span>{currencyFormatter.format(finance.outstandingBalances)} remains open across active contract balances.</span>
              </div>
            </div>

            <div className="admin-record-table-shell">
              <table className="admin-records-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Event</th>
                    <th>Payment</th>
                    <th>Due</th>
                    <th>Paid</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.payments.length ? (
                    finance.payments.slice(0, 6).map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.client_name}</td>
                        <td>
                          <strong>{payment.event_type ?? "Event"}</strong>
                          <span className="muted">{payment.event_date ?? "Date pending"}</span>
                        </td>
                        <td>{payment.payment_kind.replace(/_/g, " ")}</td>
                        <td>{payment.due_date ?? "—"}</td>
                        <td>{payment.paid_at ?? "—"}</td>
                        <td>{currencyFormatter.format(payment.amount)}</td>
                        <td>{payment.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>No income records have been created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="card admin-section-card">
            <AdminSectionHeader
              title="Finance health"
              description="Keep CRM forecast separate from actual money movement."
            />
            <div className="admin-mini-metrics admin-mini-metrics--plain">
              <div>
                <strong>Outstanding balances</strong>
                <span>{currencyFormatter.format(finance.outstandingBalances)} still due from confirmed work.</span>
              </div>
              <div>
                <strong>Expense coverage</strong>
                <span>{currencyFormatter.format(finance.recordedIncome - finance.trackedExpenses)} net before remaining balances.</span>
              </div>
              <div>
                <strong>Finance source of truth</strong>
                <span>This module tracks cash, receipts, and expenses. CRM tracks forecast and pipeline only.</span>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {tab === "income" ? (
        <section className="card admin-section-card">
          <AdminSectionHeader
            title="Income ledger"
            description="Review payments, due dates, and receipt status from the live contract payment records."
          />
          {finance.payments.length ? (
            <div className="admin-record-table-shell">
              <table className="admin-records-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Event type</th>
                    <th>Event date</th>
                    <th>Payment kind</th>
                    <th>Due date</th>
                    <th>Paid at</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.client_name}</td>
                      <td>{payment.event_type ?? "—"}</td>
                      <td>{payment.event_date ?? "—"}</td>
                      <td>{payment.payment_kind.replace(/_/g, " ")}</td>
                      <td>{payment.due_date ?? "—"}</td>
                      <td>{payment.paid_at ?? "—"}</td>
                      <td>{currencyFormatter.format(payment.amount)}</td>
                      <td>{payment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              title="No finance payments yet"
              description="Once invoices, deposits, or receipts are recorded, they will appear here as the finance ledger."
            />
          )}
        </section>
      ) : null}

      {tab === "expenses" ? (
        <section className="admin-section-card">
          <ExpenseManagement initialExpenses={finance.expenses} />
        </section>
      ) : null}
    </main>
  );
}
