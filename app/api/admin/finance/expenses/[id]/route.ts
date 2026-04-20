import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdminApi("finance");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("finance_expenses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
