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
};

export default function ExpenseManagement({
  initialExpenses,
}: {
  initialExpenses: ExpenseRecord[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category: "Production",
    vendor_name: "",
    description: "",
    amount: "",
    status: "recorded",
    payment_method: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshExpenses() {
    const response = await fetch("/api/admin/finance/expenses", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setExpenses(payload.expenses ?? []);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
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
    });
    setMessage("Expense recorded.");
    await refreshExpenses();
  }

  async function deleteExpense(id: string) {
    const response = await fetch(`/api/admin/finance/expenses/${id}`, { method: "DELETE" });
    if (response.ok) {
      await refreshExpenses();
    }
  }

  return (
    <div className="admin-users-workspace">
      <section className="card admin-section-card">
        <div className="admin-section-title">
          <h3>Add expense</h3>
          <p className="muted">Track vendor payouts, rentals, and production costs against the events business.</p>
        </div>
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
          <AdminActionRow
            primary={
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : "Record expense"}
              </button>
            }
          />
          {message ? <p className="muted">{message}</p> : null}
        </form>
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
                  <td>{expense.status}</td>
                  <td>
                    <button type="button" className="btn secondary" onClick={() => deleteExpense(expense.id)}>
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
