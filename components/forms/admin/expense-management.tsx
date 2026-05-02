"use client";

import { useState } from "react";
import AdminActionRow from "@/components/admin/admin-action-row";

type ExpenseRecord = {
  id: string;
  expense_date: string;
  category: string;
  vendor_name: string | null;
  description: string;
  amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  generated_from_recurring_id?: string | null;
};

type RecurringExpenseTemplate = {
  id: string;
  category: string;
  vendor_name: string | null;
  description: string;
  amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  frequency: "monthly";
  day_of_month: number;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
};

export default function ExpenseManagement({
  initialExpenses,
  initialRecurringExpenses,
  expenseTrackingAvailable,
  expenseTrackingMessage,
  recurringExpenseTrackingAvailable,
  recurringExpenseTrackingMessage,
}: {
  initialExpenses: ExpenseRecord[];
  initialRecurringExpenses: RecurringExpenseTemplate[];
  expenseTrackingAvailable: boolean;
  expenseTrackingMessage: string | null;
  recurringExpenseTrackingAvailable: boolean;
  recurringExpenseTrackingMessage: string | null;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [recurringExpenses, setRecurringExpenses] = useState(initialRecurringExpenses);
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category: "Production",
    vendor_name: "",
    description: "",
    amount: "",
    status: "recorded",
    payment_method: "",
    notes: "",
    recurring_monthly: false,
    recurring_day_of_month: String(new Date().getDate()),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshExpenses() {
    if (!expenseTrackingAvailable) {
      return;
    }

    const response = await fetch("/api/admin/finance/expenses", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setExpenses(payload.expenses ?? []);
      setRecurringExpenses(payload.recurringTemplates ?? []);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!expenseTrackingAvailable) {
      setMessage(expenseTrackingMessage || "Expense tracking is not configured yet.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        recurring_day_of_month: Number(form.recurring_day_of_month),
      }),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Unable to record expense.");
      return;
    }

    setForm({
      expense_date: new Date().toISOString().slice(0, 10),
      category: "Production",
      vendor_name: "",
      description: "",
      amount: "",
      status: "recorded",
      payment_method: "",
      notes: "",
      recurring_monthly: false,
      recurring_day_of_month: String(new Date().getDate()),
    });
    setMessage(
      form.recurring_monthly
        ? "Expense recorded and recurring monthly expense saved."
        : "Expense recorded."
    );
    await refreshExpenses();
  }

  async function deleteExpense(id: string) {
    if (!expenseTrackingAvailable) {
      setMessage(expenseTrackingMessage || "Expense tracking is not configured yet.");
      return;
    }

    const response = await fetch(`/api/admin/finance/expenses/${id}`, { method: "DELETE" });
    if (response.ok) {
      await refreshExpenses();
    }
  }

  async function stopRecurringExpense(id: string) {
    if (!recurringExpenseTrackingAvailable) {
      setMessage(
        recurringExpenseTrackingMessage || "Recurring expense tracking is not configured yet."
      );
      return;
    }

    const response = await fetch(`/api/admin/finance/recurring-expenses/${id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Unable to stop recurring expense.");
      return;
    }

    setRecurringExpenses((current) => current.filter((item) => item.id !== id));
    setMessage("Recurring expense stopped.");
  }

  return (
    <div className="admin-users-workspace">
      <section className="card admin-section-card">
        <div className="admin-section-title">
          <h3>Add expense</h3>
          <p className="muted">Track vendor payouts, rentals, and production costs against the events business.</p>
        </div>
        {!expenseTrackingAvailable ? (
          <p className="muted">{expenseTrackingMessage}</p>
        ) : null}
        <form className="admin-settings-form" onSubmit={handleSubmit}>
          <div className="admin-dashboard-form-grid">
            <label>
              <span>Date</span>
              <input type="date" value={form.expense_date} onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))} required />
            </label>
            <label>
              <span>Category</span>
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
            </label>
            <label>
              <span>Vendor</span>
              <input value={form.vendor_name} onChange={(event) => setForm((current) => ({ ...current, vendor_name: event.target.value }))} />
            </label>
            <label>
              <span>Description</span>
              <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
            </label>
            <label>
              <span>Amount</span>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
            </label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="recorded">Recorded</option>
                <option value="paid">Paid</option>
                <option value="planned">Planned</option>
              </select>
            </label>
            <label>
              <span>Payment method</span>
              <input value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))} />
            </label>
            <label>
              <span>Notes</span>
              <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <div className="admin-recurring-expense-panel">
            <label className="admin-recurring-expense-toggle">
              <input
                type="checkbox"
                checked={form.recurring_monthly}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurring_monthly: event.target.checked,
                    recurring_day_of_month: current.recurring_day_of_month || String(new Date(current.expense_date).getDate()),
                  }))
                }
              />
              <span>
                <strong>Make this a recurring monthly expense</strong>
                <small>Use this for fixed costs like storage units, subscriptions, utilities, and rent.</small>
              </span>
            </label>

            {form.recurring_monthly ? (
              <div className="admin-dashboard-form-grid">
                <label>
                  <span>Charge day each month</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={form.recurring_day_of_month}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recurring_day_of_month: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <div className="admin-recurring-expense-help">
                  <strong>Automatic monthly posting</strong>
                  <p className="muted">
                    Future monthly entries will be auto-added to the expense ledger through the finance backend.
                  </p>
                  {!recurringExpenseTrackingAvailable && recurringExpenseTrackingMessage ? (
                    <p className="muted">{recurringExpenseTrackingMessage}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          <AdminActionRow
            primary={
              <button type="submit" className="btn" disabled={saving || !expenseTrackingAvailable}>
                {saving ? "Saving..." : "Record expense"}
              </button>
            }
          />
          {message ? <p className="muted">{message}</p> : null}
        </form>
      </section>

      <section className="card admin-section-card">
        <div className="admin-section-title">
          <h3>Recurring monthly expenses</h3>
          <p className="muted">Fixed costs that automatically create monthly finance expense entries.</p>
        </div>
        {!recurringExpenseTrackingAvailable ? (
          <p className="muted">{recurringExpenseTrackingMessage}</p>
        ) : recurringExpenses.length ? (
          <div className="admin-record-table-shell">
            <table className="admin-records-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Repeats</th>
                  <th>Starts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td>{expense.category}</td>
                    <td>{expense.vendor_name ?? "—"}</td>
                    <td>${expense.amount.toLocaleString()}</td>
                    <td>Monthly on day {expense.day_of_month}</td>
                    <td>{expense.starts_on}</td>
                    <td>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => stopRecurringExpense(expense.id)}
                      >
                        Stop recurring
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No recurring monthly expenses saved yet.</p>
        )}
      </section>

      <section className="card admin-section-card">
        <div className="admin-section-title">
          <h3>Expense ledger</h3>
          <p className="muted">All tracked costs in one place.</p>
        </div>
        <div className="admin-record-table-shell">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length ? expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.expense_date}</td>
                  <td>{expense.category}</td>
                  <td>{expense.vendor_name ?? "—"}</td>
                  <td>{expense.description}</td>
                  <td>${expense.amount.toLocaleString()}</td>
                  <td>
                    {expense.status}
                    {expense.generated_from_recurring_id ? (
                      <span className="admin-inline-meta-chip">Recurring</span>
                    ) : null}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => deleteExpense(expense.id)}
                      disabled={!expenseTrackingAvailable}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>No expenses recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
