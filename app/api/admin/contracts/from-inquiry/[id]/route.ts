import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { buildContractDetailsFromInquiry } from "@/lib/contracts";
import { logActivity, upsertClientByEmail } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi("sales");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await context.params;

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("event_inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const { data: existingContract } = await supabaseAdmin
      .from("contracts")
      .select("id")
      .eq("inquiry_id", inquiry.id)
      .maybeSingle();

    if (existingContract) {
      return NextResponse.json(
        { success: true, contract: existingContract, existing: true },
        { status: 200 }
      );
    }

    const total = Number(inquiry.estimated_price ?? 0);
    const deposit = total > 0 ? total / 2 : 0;

    let balanceDueDate: string | null = null;
    if (inquiry.event_date) {
      const eventDate = new Date(inquiry.event_date);
      eventDate.setDate(eventDate.getDate() - 30);
      balanceDueDate = eventDate.toISOString().split("T")[0];
    }

    const client =
      inquiry.client_id
        ? { id: inquiry.client_id }
        : await upsertClientByEmail(supabaseAdmin, {
            firstName: inquiry.first_name,
            lastName: inquiry.last_name,
            email: inquiry.email,
            phone: inquiry.phone,
            preferredContactMethod: inquiry.preferred_contact_method,
            city: inquiry.city,
            state: inquiry.state,
            source: inquiry.referral_source,
          });

    if (!inquiry.client_id) {
      await supabaseAdmin
        .from("event_inquiries")
        .update({ client_id: client.id })
        .eq("id", inquiry.id);
    }

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .insert({
        inquiry_id: inquiry.id,
        client_id: client.id,
        client_name: `${inquiry.first_name} ${inquiry.last_name}`,
        client_email: inquiry.email,
        client_phone: inquiry.phone,
        event_type: inquiry.event_type,
        event_date: inquiry.event_date || null,
        venue_name: inquiry.venue_name || null,
        guest_count: inquiry.guest_count ?? null,
        contract_total: total,
        deposit_amount: deposit,
        balance_due_date: balanceDueDate,
        contract_status: "draft",
        scope_json: {
          services: inquiry.services ?? [],
          colors_theme: inquiry.colors_theme ?? null,
          inspiration_notes: inquiry.inspiration_notes ?? null,
          additional_info: inquiry.additional_info ?? null,
          venue_status: inquiry.venue_status ?? null,
          indoor_outdoor: inquiry.indoor_outdoor ?? null,
          needs_delivery_setup: inquiry.needs_delivery_setup ?? false,
        },
        contract_details_json: buildContractDetailsFromInquiry(inquiry),
      })
      .select()
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: contractError?.message || "Failed to create contract" },
        { status: 500 }
      );
    }

    const paymentRows = [
      {
        contract_id: contract.id,
        client_id: client.id,
        payment_kind: "deposit",
        amount: deposit,
        due_date: new Date().toISOString().split("T")[0],
        status: "pending",
      },
      {
        contract_id: contract.id,
        client_id: client.id,
        payment_kind: "balance",
        amount: total - deposit,
        due_date: balanceDueDate,
        status: "pending",
      },
    ].filter((row) => row.amount > 0);

    if (paymentRows.length > 0) {
      const { error: paymentError } = await supabaseAdmin
        .from("contract_payments")
        .insert(paymentRows);

      if (paymentError) {
        console.error("Failed to seed contract payments:", paymentError.message);
      }
    }

    await logActivity(supabaseAdmin, {
      entityType: "contract",
      entityId: contract.id,
      action: "contract.created",
      summary: "Contract created from inquiry",
      metadata: {
        inquiry_id: inquiry.id,
        client_id: client.id,
        contract_total: contract.contract_total,
      },
    });

    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error) {
    console.error("Create contract from inquiry failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
