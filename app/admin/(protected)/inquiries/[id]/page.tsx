import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import InquiryStatusForm from "@/components/forms/admin/inquiry-status-form";
import ConsultationManagementForm from "@/components/forms/admin/consultation-management-form";
import QuoteManagementForm from "@/components/forms/admin/quote-management-form";
import CreateContractButton from "@/components/forms/admin/create-contract-button";
import VendorReferralForm from "@/components/forms/admin/vendor-referral-form";
export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: inquiry, error } = await supabaseAdmin
    .from("event_inquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !inquiry) {
    console.error("Inquiry lookup failed:", { id, error });
    notFound();
  }

  const { data: vendors } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, service_categories, default_referral_fee")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("business_name", { ascending: true });

  const { data: vendorReferrals } = await supabaseAdmin
    .from("vendor_referrals")
    .select("id, category, status, fee_amount, created_at, vendor:vendor_accounts(business_name)")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false });

  const { data: pricingCatalogItems } = await supabaseAdmin
    .from("pricing_catalog_items")
    .select("id, name, category, variant, unit_label, unit_price, is_active, notes, sort_order")
    .eq("is_active", true)
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  const { data: inquiryQuotePricing } = await supabaseAdmin
    .from("inquiry_quote_pricing")
    .select("inquiry_id, base_fee, discount_amount, delivery_fee, labor_adjustment, tax_amount, manual_total_override, notes")
    .eq("inquiry_id", id)
    .maybeSingle();

  const { data: inquiryQuoteLineItems } = await supabaseAdmin
    .from("inquiry_quote_line_items")
    .select("id, inquiry_id, pricing_catalog_item_id, item_name, category, variant, unit_label, unit_price, quantity, line_total, notes, sort_order, is_custom")
    .eq("inquiry_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const timeline = [
    {
      label: "Inquiry Received",
      value: inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : "—",
      tone: "neutral",
    },
    {
      label: "Quoted",
      value: inquiry.quoted_at ? new Date(inquiry.quoted_at).toLocaleString() : "Not yet",
      tone: inquiry.quoted_at ? "active" : "muted",
    },
    {
      label: "Booked",
      value: inquiry.booked_at ? new Date(inquiry.booked_at).toLocaleString() : "Not yet",
      tone: inquiry.booked_at ? "success" : "muted",
    },
  ];

  return (
    <main className="container section">
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/inquiries" className="btn secondary">
          ← Back to Inquiries
        </Link>
      </div>

      <h2>Inquiry CRM View</h2>
      <p className="lead">
        Review the client, event scope, and next sales action in one place.
      </p>

      <div className="crm-overview">
        <div className="crm-hero-card card">
          <p className="eyebrow">Lead summary</p>
          <h3>{inquiry.first_name} {inquiry.last_name}</h3>
          <p className="muted">
            {inquiry.event_type} {inquiry.event_date ? `• ${inquiry.event_date}` : ""} {inquiry.venue_name ? `• ${inquiry.venue_name}` : ""}
          </p>
          <div className="summary-pills">
            <span className="summary-chip">Status: {inquiry.status ?? "new"}</span>
            <span className="summary-chip">Quote: ${Number(inquiry.estimated_price ?? 0).toLocaleString()}</span>
            <span className="summary-chip">Guest count: {inquiry.guest_count ?? "—"}</span>
            <span className="summary-chip">Consultation: {inquiry.consultation_status ?? "not_scheduled"}</span>
          </div>
        </div>

        <div className="crm-timeline card">
          <p className="eyebrow">Pipeline timeline</p>
          {timeline.map((item) => (
            <div key={item.label} className={`timeline-row ${item.tone}`}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Client Information</h3>
          <p><strong>Name:</strong> {inquiry.first_name} {inquiry.last_name}</p>
          <p><strong>Email:</strong> {inquiry.email}</p>
          <p><strong>Phone:</strong> {inquiry.phone}</p>
          <p><strong>Preferred Contact:</strong> {inquiry.preferred_contact_method ?? "—"}</p>
          <p><strong>Referral Source:</strong> {inquiry.referral_source ?? "—"}</p>
        </div>

        <div className="card">
          <h3>Event Information</h3>
          <p><strong>Event Type:</strong> {inquiry.event_type}</p>
          <p><strong>Event Date:</strong> {inquiry.event_date ?? "—"}</p>
          <p><strong>Guest Count:</strong> {inquiry.guest_count ?? "—"}</p>
          <p><strong>Venue Name:</strong> {inquiry.venue_name ?? "—"}</p>
          <p><strong>Venue Status:</strong> {inquiry.venue_status ?? "—"}</p>
          <p><strong>Indoor / Outdoor:</strong> {inquiry.indoor_outdoor ?? "—"}</p>
          <p><strong>Consultation Type:</strong> {inquiry.consultation_type ?? "—"}</p>
          <p><strong>Consultation At:</strong> {inquiry.consultation_at ? new Date(inquiry.consultation_at).toLocaleString() : "—"}</p>
          <p><strong>Follow-Up At:</strong> {inquiry.follow_up_at ? new Date(inquiry.follow_up_at).toLocaleString() : "—"}</p>
        </div>

        <div className="card">
          <h3>Decor Scope</h3>
          <p><strong>Colors / Theme:</strong> {inquiry.colors_theme ?? "—"}</p>
          <div className="summary-pills">
            {inquiry.services?.length
              ? inquiry.services.map((service: string) => (
                  <span key={service} className="summary-chip">{service}</span>
                ))
              : <p className="muted">No decor items selected.</p>}
          </div>
          <p><strong>Needs Delivery / Setup:</strong> {inquiry.needs_delivery_setup ? "Yes" : "No"}</p>
          <p><strong>Current Quote Amount:</strong> ${inquiry.estimated_price ?? 0}</p>
          <p><strong>Quote Response:</strong> {inquiry.quote_response_status ?? "not_sent"}</p>
        </div>

        <div className="card">
          <h3>Notes from Client</h3>
          <p><strong>Inspiration Notes:</strong></p>
          <p>{inquiry.inspiration_notes ?? "—"}</p>
          <p><strong>Vision Board:</strong></p>
          {inquiry.vision_board_urls?.length ? (
            <div className="vision-board-grid vision-board-grid--admin">
              {inquiry.vision_board_urls.map((url: string) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="vision-board-item vision-board-item--admin"
                >
                  <img src={url} alt="Client inspiration upload" />
                </a>
              ))}
            </div>
          ) : (
            <p>—</p>
          )}
          <p><strong>Additional Info:</strong></p>
          <p>{inquiry.additional_info ?? "—"}</p>
        </div>
      </div>

      <div style={{ marginTop: "24px" }} className="card">
        <h3>Next Action</h3>
        <p className="muted">
          Move the lead through the pipeline, add context for the consultation,
          and create a contract once scope is clear.
        </p>

        <InquiryStatusForm
          inquiryId={inquiry.id}
          currentStatus={inquiry.status ?? "new"}
          currentNotes={inquiry.admin_notes ?? ""}
        />
        <ConsultationManagementForm
          inquiryId={inquiry.id}
          initialConsultationStatus={inquiry.consultation_status ?? "not_scheduled"}
          initialConsultationType={inquiry.consultation_type ?? null}
          initialConsultationAt={inquiry.consultation_at ?? null}
          initialFollowUpAt={inquiry.follow_up_at ?? null}
          initialQuoteResponseStatus={inquiry.quote_response_status ?? "not_sent"}
        />
        <QuoteManagementForm
          inquiryId={inquiry.id}
          currentAmount={inquiry.estimated_price ?? null}
          clientEmail={inquiry.email ?? null}
          clientName={`${inquiry.first_name} ${inquiry.last_name}`}
          catalogItems={pricingCatalogItems ?? []}
          initialPricing={inquiryQuotePricing ?? null}
          initialLineItems={inquiryQuoteLineItems ?? []}
        />
        <VendorReferralForm
          inquiryId={inquiry.id}
          initialRequestedCategories={inquiry.requested_vendor_categories ?? []}
          initialVendorRequestNotes={inquiry.vendor_request_notes ?? null}
          vendors={vendors ?? []}
          existingReferrals={vendorReferrals ?? []}
        />
        <CreateContractButton inquiryId={inquiry.id} />
      </div>
    </main>
  );
}
