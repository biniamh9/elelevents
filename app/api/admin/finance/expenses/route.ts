import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

function isMissingRelationError(error: { code?: string | null; message?: string | null } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("relation") && error.message.toLowerCase().includes("does not exist");
}

export async function GET() {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const { data, error } = await supabaseAdmin
    .from("finance_expenses")
    .select("id, expense_date, category, vendor_name, description, amount, status, payment_method, notes")
    .order("expense_date", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) {
      return NextResponse.json({
        expenses: [],
        configured: false,
        message: "Expense tracking is not configured yet. Run the finance expenses SQL migration to enable this endpoint.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const amount = Number(body.amount);

  if (!body.expense_date || !body.category || !body.description || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Date, category, description, and valid amount are required." }, { status: 400 });
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

  return NextResponse.json({ success: true, id: data.id });
}
