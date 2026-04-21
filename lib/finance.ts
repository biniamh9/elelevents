import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type FinanceOverview = {
  recordedIncome: number;
  outstandingDeposits: number;
  paidReceipts: number;
  trackedExpenses: number;
  outstandingBalances: number;
  depositCollectionRate: number;
  expenseTrackingAvailable: boolean;
  expenseTrackingMessage: string | null;
  payments: Array<{
    id: string;
    client_name: string;
    event_type: string | null;
    event_date: string | null;
    payment_kind: string;
    amount: number;
    due_date: string | null;
    paid_at: string | null;
    status: string;
  }>;
  expenses: Array<{
    id: string;
    expense_date: string;
    category: string;
    vendor_name: string | null;
    description: string;
    amount: number;
    status: string;
    payment_method: string | null;
    notes: string | null;
  }>;
};

function isMissingRelationError(error: { code?: string | null; message?: string | null } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("relation") && error.message.toLowerCase().includes("does not exist");
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  const [{ data: payments, error: paymentsError }, { data: expenses, error: expensesError }, { data: contracts, error: contractsError }] =
    await Promise.all([
      supabaseAdmin
        .from("contract_payments")
        .select("id, payment_kind, amount, due_date, paid_at, status, contract:contracts(client_name,event_type,event_date)")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("finance_expenses")
        .select("id, expense_date, category, vendor_name, description, amount, status, payment_method, notes")
        .order("expense_date", { ascending: false }),
      supabaseAdmin
        .from("contracts")
        .select("id, deposit_amount, deposit_paid, balance_due, contract_status"),
    ]);

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }
  if (expensesError && !isMissingRelationError(expensesError)) {
    throw new Error(expensesError.message);
  }
  if (contractsError) {
    throw new Error(contractsError.message);
  }

  const normalizedPayments = (payments ?? []).map((item: any) => ({
    id: item.id,
    client_name: Array.isArray(item.contract) ? item.contract[0]?.client_name ?? "Unknown client" : item.contract?.client_name ?? "Unknown client",
    event_type: Array.isArray(item.contract) ? item.contract[0]?.event_type ?? null : item.contract?.event_type ?? null,
    event_date: Array.isArray(item.contract) ? item.contract[0]?.event_date ?? null : item.contract?.event_date ?? null,
    payment_kind: item.payment_kind,
    amount: Number(item.amount ?? 0),
    due_date: item.due_date,
    paid_at: item.paid_at,
    status: item.status,
  }));

  const normalizedExpenses = (expenses ?? []).map((item: any) => ({
    id: item.id,
    expense_date: item.expense_date,
    category: item.category,
    vendor_name: item.vendor_name,
    description: item.description,
    amount: Number(item.amount ?? 0),
    status: item.status,
    payment_method: item.payment_method,
    notes: item.notes,
  }));

  const recordedIncome = normalizedPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingDeposits = (contracts ?? [])
    .filter((contract: any) => !contract.deposit_paid && Number(contract.deposit_amount ?? 0) > 0)
    .reduce((sum: number, contract: any) => sum + Number(contract.deposit_amount ?? 0), 0);
  const outstandingBalances = (contracts ?? [])
    .filter((contract: any) => Number(contract.balance_due ?? 0) > 0)
    .reduce((sum: number, contract: any) => sum + Number(contract.balance_due ?? 0), 0);
  const paidReceipts = normalizedPayments.filter((payment) => payment.status === "paid").length;
  const trackedExpenses = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const depositContracts = (contracts ?? []).filter((contract: any) => Number(contract.deposit_amount ?? 0) > 0);
  const depositPaidContracts = depositContracts.filter((contract: any) => contract.deposit_paid);
  const depositCollectionRate =
    depositContracts.length > 0
      ? Math.round((depositPaidContracts.length / depositContracts.length) * 100)
      : 0;
  const expenseTrackingAvailable = !isMissingRelationError(expensesError);
  const expenseTrackingMessage = expenseTrackingAvailable
    ? null
    : "Expense tracking is not configured yet. Run the finance expenses SQL migration to enable this tab.";

  return {
    recordedIncome,
    outstandingDeposits,
    paidReceipts,
    trackedExpenses,
    outstandingBalances,
    depositCollectionRate,
    expenseTrackingAvailable,
    expenseTrackingMessage,
    payments: normalizedPayments,
    expenses: normalizedExpenses,
  };
}
