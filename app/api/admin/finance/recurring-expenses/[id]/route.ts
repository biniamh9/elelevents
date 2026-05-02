import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { isMissingRelationError } from "@/lib/finance-recurring";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("finance_recurring_expenses")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    if (isMissingRelationError(error)) {
      return NextResponse.json(
        {
          error:
            "Recurring expense tracking is not configured yet. Run the recurring finance expense SQL migration first.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
