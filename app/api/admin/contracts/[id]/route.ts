import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { normalizeContractDetails } from "@/lib/contracts";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const allowedStatuses = ["draft", "sent", "signed", "deposit_paid", "closed"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;
    const body = await request.json();

    const { data: contract, error: fetchError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.contract_status) {
      if (!allowedStatuses.includes(body.contract_status)) {
        return NextResponse.json({ error: "Invalid contract status" }, { status: 400 });
      }

      updates.contract_status = body.contract_status;

      if (body.contract_status === "signed" && !contract.signed_at) {
        updates.signed_at = new Date().toISOString();
      }

      if (body.contract_status === "closed" && !contract.closed_at) {
        updates.closed_at = new Date().toISOString();
      }
    }

    if (typeof body.docusign_url === "string") {
      updates.docusign_url = body.docusign_url.trim() || null;
    }

    if (typeof body.pdf_url === "string") {
      updates.pdf_url = body.pdf_url.trim() || null;
    }

    if (typeof body.notes === "string") {
      updates.notes = body.notes;
    }

    if (body.contract_total !== undefined) {
      const contractTotal = Number(body.contract_total);
      if (!Number.isFinite(contractTotal) || contractTotal < 0) {
        return NextResponse.json(
          { error: "Contract total must be a valid non-negative number" },
          { status: 400 }
        );
      }

      updates.contract_total = contractTotal;
    }

    if (body.deposit_amount !== undefined) {
      const depositAmount = Number(body.deposit_amount);
      if (!Number.isFinite(depositAmount) || depositAmount < 0) {
        return NextResponse.json(
          { error: "Deposit amount must be a valid non-negative number" },
          { status: 400 }
        );
      }

      updates.deposit_amount = depositAmount;
    }

    if (body.balance_due_date !== undefined) {
      updates.balance_due_date =
        typeof body.balance_due_date === "string" && body.balance_due_date.trim()
          ? body.balance_due_date
          : null;
    }

    let depositPaid = contract.deposit_paid;
    if (typeof body.deposit_paid === "boolean") {
      depositPaid = body.deposit_paid;
      updates.deposit_paid = depositPaid;
      updates.deposit_paid_at = depositPaid
        ? contract.deposit_paid_at || new Date().toISOString()
        : null;

      if (depositPaid && !body.contract_status && contract.contract_status !== "deposit_paid") {
        updates.contract_status = "deposit_paid";
      }
    }

    if (body.contract_details_json !== undefined) {
      updates.contract_details_json = normalizeContractDetails(
        body.contract_details_json,
        {
          ...contract,
          ...updates,
        }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message || "Failed to update contract" },
        { status: 500 }
      );
    }

    if (typeof body.deposit_paid === "boolean") {
      if (body.deposit_paid) {
        const { data: existingDeposit } = await supabaseAdmin
          .from("contract_payments")
          .select("id")
          .eq("contract_id", id)
          .eq("payment_kind", "deposit")
          .maybeSingle();

        if (existingDeposit) {
          await supabaseAdmin
            .from("contract_payments")
            .update({
              status: "paid",
              paid_at: updated.deposit_paid_at,
              amount: updated.deposit_amount ?? 0,
              client_id: updated.client_id ?? null,
            })
            .eq("id", existingDeposit.id);
        } else if ((updated.deposit_amount ?? 0) > 0) {
          await supabaseAdmin.from("contract_payments").insert({
            contract_id: updated.id,
            client_id: updated.client_id ?? null,
            payment_kind: "deposit",
            amount: updated.deposit_amount ?? 0,
            due_date: new Date().toISOString().split("T")[0],
            paid_at: updated.deposit_paid_at,
            status: "paid",
          });
        }
      } else {
        await supabaseAdmin
          .from("contract_payments")
          .update({
            status: "pending",
            paid_at: null,
          })
          .eq("contract_id", id)
          .eq("payment_kind", "deposit");
      }
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: updated.id,
      action: "contract.updated",
      summary: "Contract updated from admin CRM",
      metadata: {
        previous_status: contract.contract_status,
        new_status: updated.contract_status,
        deposit_paid: updated.deposit_paid,
      },
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}
