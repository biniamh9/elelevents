import type { SupabaseClient } from "@supabase/supabase-js";

export type RecurringExpenseTemplate = {
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

export function isMissingRelationError(
  error: { code?: string | null; message?: string | null } | null
) {
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    (error?.message?.toLowerCase().includes("relation") &&
      error.message.toLowerCase().includes("does not exist")) ||
    (error?.message?.toLowerCase().includes("column") &&
      error.message.toLowerCase().includes("does not exist"))
  );
}

function startOfMonth(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toMonthKey(value: string | Date) {
  return startOfMonth(value).toISOString().slice(0, 10);
}

function clampDayOfMonth(day: number) {
  return Math.max(1, Math.min(28, Math.floor(day)));
}

function buildExpenseDate(monthStart: Date, dayOfMonth: number) {
  const day = clampDayOfMonth(dayOfMonth);
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)
  )
    .toISOString()
    .slice(0, 10);
}

function getMonthRange(fromDate: string, throughDate: Date) {
  const months: Date[] = [];
  const cursor = startOfMonth(fromDate);
  const limit = startOfMonth(throughDate);

  while (cursor.getTime() <= limit.getTime()) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

export async function syncRecurringExpenses(
  supabase: SupabaseClient,
  throughDate = new Date()
) {
  const { data: templates, error: templatesError } = await supabase
    .from("finance_recurring_expenses")
    .select(
      "id, category, vendor_name, description, amount, status, payment_method, notes, frequency, day_of_month, starts_on, ends_on, is_active"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (templatesError) {
    if (isMissingRelationError(templatesError)) {
      return {
        configured: false,
        templates: [] as RecurringExpenseTemplate[],
        message:
          "Recurring expense tracking is not configured yet. Run the recurring finance expense SQL migration to enable it.",
      };
    }
    throw new Error(templatesError.message);
  }

  const recurringTemplates = (templates ?? []) as RecurringExpenseTemplate[];

  if (!recurringTemplates.length) {
    return {
      configured: true,
      templates: recurringTemplates,
      message: null,
    };
  }

  const templateIds = recurringTemplates.map((template) => template.id);
  const earliestStart = recurringTemplates
    .map((template) => template.starts_on)
    .sort()[0];

  const { data: existingExpenses, error: existingError } = await supabase
    .from("finance_expenses")
    .select("generated_from_recurring_id, expense_date")
    .in("generated_from_recurring_id", templateIds)
    .gte("expense_date", earliestStart)
    .lte("expense_date", throughDate.toISOString().slice(0, 10));

  if (existingError) {
    if (isMissingRelationError(existingError)) {
      return {
        configured: false,
        templates: recurringTemplates,
        message:
          "Recurring expense tracking is not configured yet. Run the recurring finance expense SQL migration to enable it.",
      };
    }
    throw new Error(existingError.message);
  }

  const existingKeys = new Set(
    (existingExpenses ?? []).map(
      (item: { generated_from_recurring_id: string | null; expense_date: string }) =>
        `${item.generated_from_recurring_id}:${toMonthKey(item.expense_date)}`
    )
  );

  const rowsToInsert = recurringTemplates.flatMap((template) => {
    const months = getMonthRange(template.starts_on, throughDate);
    return months
      .filter((monthStart) => {
        const monthKey = `${template.id}:${toMonthKey(monthStart)}`;
        if (existingKeys.has(monthKey)) {
          return false;
        }
        if (template.ends_on) {
          const templateEndMonth = startOfMonth(template.ends_on);
          if (monthStart.getTime() > templateEndMonth.getTime()) {
            return false;
          }
        }
        return true;
      })
      .map((monthStart) => ({
        expense_date: buildExpenseDate(monthStart, template.day_of_month),
        category: template.category,
        vendor_name: template.vendor_name,
        description: template.description,
        amount: template.amount,
        status: template.status,
        payment_method: template.payment_method,
        notes: template.notes,
        generated_from_recurring_id: template.id,
      }));
  });

  if (rowsToInsert.length) {
    const { error: insertError } = await supabase
      .from("finance_expenses")
      .insert(rowsToInsert);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    configured: true,
    templates: recurringTemplates,
    message: null,
  };
}
