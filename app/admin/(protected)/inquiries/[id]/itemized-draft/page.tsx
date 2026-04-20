import Link from "next/link";
import { notFound } from "next/navigation";
import ItemizedPricePreview from "@/components/forms/admin/itemized-price-preview";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function InquiryItemizedDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("overview");

  const { id } = await params;

  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, email, event_type, event_date, venue_name")
    .eq("id", id)
    .single();

  if (inquiryError || !inquiry) {
    notFound();
  }

  const { data: pricing } = await supabaseAdmin
    .from("inquiry_quote_pricing")
    .select("inquiry_id, base_fee, discount_amount, delivery_fee, labor_adjustment, tax_amount, manual_total_override, notes, draft_status, client_disclaimer, generated_at, ready_to_send_at, shared_with_customer_at")
    .eq("inquiry_id", id)
    .maybeSingle();

  const { data: lineItems } = await supabaseAdmin
    .from("inquiry_quote_line_items")
    .select("id, inquiry_id, pricing_catalog_item_id, item_name, category, variant, unit_label, unit_price, quantity, line_total, notes, sort_order, is_custom")
    .eq("inquiry_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return (
    <main className="admin-page section">
      <div style={{ marginBottom: "20px" }}>
        <Link href={`/admin/inquiries/${id}`} className="btn secondary">
          ← Back to Inquiry
        </Link>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Itemized Price Draft</p>
        <h1>Client-facing estimate preview</h1>
        <p className="lead">
          Use this view to review the customer-ready breakdown before marking it
          ready to send or sharing it.
        </p>
      </div>

      <ItemizedPricePreview
        clientName={`${inquiry.first_name} ${inquiry.last_name}`}
        clientEmail={inquiry.email}
        eventType={inquiry.event_type}
        eventDate={inquiry.event_date}
        venueName={inquiry.venue_name}
        pricing={pricing}
        lineItems={lineItems ?? []}
      />
    </main>
  );
}
