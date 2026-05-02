import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { isMissingRelationError, syncRecurringExpenses } from "@/lib/finance-recurring";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function GET() {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const recurringSync = await syncRecurringExpenses(supabaseAdmin);

  let { data, error } = await supabaseAdmin
    .from("finance_expenses")
    .select("id, expense_date, category, vendor_name, description, amount, status, payment_method, notes, generated_from_recurring_id")
    .order("expense_date", { ascending: false });

  if (error && isMissingRelationError(error)) {
    const fallback = await supabaseAdmin
      .from("finance_expenses")
      .select("id, expense_date, category, vendor_name, description, amount, status, payment_method, notes")
      .order("expense_date", { ascending: false });
    data = fallback.data?.map((item) => ({
      ...item,
      generated_from_recurring_id: null,
    }));
    error = fallback.error;
  }

  if (error) {
    if (isMissingRelationError(error)) {
      return NextResponse.json({
        expenses: [],
        configured: false,
        message: "Expense tracking is not configured yet. Run the finance expenses SQL migration to enable this endpoint.",
        recurringTemplates: [],
        recurringConfigured: recurringSync.configured,
        recurringMessage: recurringSync.message,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    expenses: data ?? [],
    recurringTemplates: recurringSync.templates,
    recurringConfigured: recurringSync.configured,
    recurringMessage: recurringSync.message,
  });
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const amount = Number(body.amount);

  if (!body.expense_date || !body.category || !body.description || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Date, category, description, and valid amount are required." }, { status: 400 });
  }

  const recurringMonthly = Boolean(body.recurring_monthly);
  const recurringDayOfMonth = recurringMonthly
    ? Math.max(
        1,
        Math.min(
          28,
          Number.isFinite(Number(body.recurring_day_of_month))
            ? Math.floor(Number(body.recurring_day_of_month))
            : new Date(body.expense_date).getUTCDate()
        )
      )
    : null;

  if (recurringMonthly) {
    const recurringSync = await syncRecurringExpenses(supabaseAdmin);
    if (!recurringSync.configured) {
      return NextResponse.json(
        {
          error:
            recurringSync.message ||
            "Recurring expense tracking is not configured yet. Run the recurring finance expense SQL migration first.",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("finance_expenses")
    .insert({
      expense_date: body.expense_date,
      category: String(body.category).trim(),
      vendor_name: typeof body.vendor_name === "string" ? body.vendor_name.trim() || null : null,
      description: String(body.description).trim(),
      amount,
      status: typeof body.status === "string" ? body.status : "recorded",
      payment_method: typeof body.payment_method === "string" ? body.payment_method.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (isMissingRelationError(error)) {
      return NextResponse.json(
        { error: "Expense tracking is not configured yet. Run the finance expenses SQL migration first." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error?.message || "Unable to save expense." }, { status: 400 });
  }

  let recurringTemplateId: string | null = null;

  if (recurringMonthly) {
    const { data: recurringTemplate, error: recurringError } = await supabaseAdmin
      .from("finance_recurring_expenses")
      .insert({
        category: String(body.category).trim(),
        vendor_name: typeof body.vendor_name === "string" ? body.vendor_name.trim() || null : null,
        description: String(body.description).trim(),
        amount,
        status: typeof body.status === "string" ? body.status : "recorded",
        payment_method: typeof body.payment_method === "string" ? body.payment_method.trim() || null : null,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        frequency: "monthly",
        day_of_month: recurringDayOfMonth,
        starts_on: body.expense_date,
        is_active: true,
      })
      .select("id")
      .single();

    if (recurringError || !recurringTemplate) {
      if (isMissingRelationError(recurringError)) {
        return NextResponse.json(
          {
            error:
              "Recurring expense tracking is not configured yet. Run the recurring finance expense SQL migration first.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: recurringError?.message || "Expense was saved, but the recurring template could not be created." },
        { status: 400 }
      );
    }

    recurringTemplateId = recurringTemplate.id;

    await supabaseAdmin
      .from("finance_expenses")
      .update({ generated_from_recurring_id: recurringTemplateId })
      .eq("id", data.id);
  }

  return NextResponse.json({ success: true, id: data.id, recurringTemplateId });
}
