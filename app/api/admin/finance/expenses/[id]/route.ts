import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

function isMissingRelationError(error: { code?: string | null; message?: string | null } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("relation") && error.message.toLowerCase().includes("does not exist");
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("finance_expenses").delete().eq("id", id);

  if (error) {
    if (isMissingRelationError(error)) {
      return NextResponse.json(
        { error: "Expense tracking is not configured yet. Run the finance expenses SQL migration first." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
