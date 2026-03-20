import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import InquiryStatusForm from "@/components/forms/admin/inquiry-status-form";
import BookingLifecycleForm from "@/components/forms/admin/booking-lifecycle-form";
import ConsultationManagementForm from "@/components/forms/admin/consultation-management-form";
import QuoteManagementForm from "@/components/forms/admin/quote-management-form";
import CreateContractButton from "@/components/forms/admin/create-contract-button";
import VendorReferralForm from "@/components/forms/admin/vendor-referral-form";
import { deriveBookingStage, getBookingWarningLabel, humanizeBookingStage, type BookingStage } from "@/lib/booking-lifecycle";
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
    .select("inquiry_id, base_fee, discount_amount, delivery_fee, labor_adjustment, tax_amount, manual_total_override, notes, draft_status, client_disclaimer, generated_at, ready_to_send_at, shared_with_customer_at")
    .eq("inquiry_id", id)
    .maybeSingle();

  const { data: inquiryQuoteLineItems } = await supabaseAdmin
    .from("inquiry_quote_line_items")
    .select("id, inquiry_id, pricing_catalog_item_id, item_name, category, variant, unit_label, unit_price, quantity, line_total, notes, sort_order, is_custom")
    .eq("inquiry_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: linkedContract } = await supabaseAdmin
    .from("contracts")
    .select("id, contract_status, contract_total, deposit_amount, balance_due, deposit_paid, event_date, balance_due_date")
    .eq("inquiry_id", id)
    .maybeSingle();

  const { count: sameDayCount } = inquiry.event_date
    ? await supabaseAdmin
        .from("event_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("event_date", inquiry.event_date)
    : { count: 0 };

  const otherEventsOnDate = Math.max((sameDayCount ?? 0) - 1, 0);
  const selectedDecorCategories = Array.isArray(inquiry.selected_decor_categories)
    ? (inquiry.selected_decor_categories as string[])
    : [];
  const decorSelections = Array.isArray(inquiry.decor_selections)
    ? (inquiry.decor_selections as Array<{
        categoryKey: string;
        categoryTitle: string;
        selectedGalleryImages?: Array<{
          id: string;
          title: string;
          image_url: string;
          category?: string | null;
        }>;
        uploadedImageUrls?: string[];
        notes?: string | null;
      }>)
    : [];
  const bookingStage: BookingStage = deriveBookingStage({
    bookingStage: inquiry.booking_stage,
    inquiryStatus: inquiry.status,
    consultationStatus: inquiry.consultation_status,
    quoteResponseStatus: inquiry.quote_response_status,
    contractStatus: linkedContract?.contract_status,
    depositPaid: linkedContract?.deposit_paid,
    completedAt: inquiry.completed_at,
  });
  const overbookingLabel = getBookingWarningLabel(otherEventsOnDate);

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
    {
      label: "Reserved",
      value: inquiry.reserved_at ? new Date(inquiry.reserved_at).toLocaleString() : "Not yet",
      tone: inquiry.reserved_at ? "success" : "muted",
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
            <span className="summary-chip">Booking: {humanizeBookingStage(bookingStage)}</span>
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
          <p><strong>Booking Status:</strong> {humanizeBookingStage(bookingStage)}</p>
          <p><strong>Floor Plan:</strong> {inquiry.floor_plan_received ? "Received" : "Pending"}</p>
          <p><strong>Walkthrough:</strong> {inquiry.walkthrough_completed ? "Completed" : "Pending"}</p>
          {overbookingLabel ? (
            <p><strong>Scheduling Warning:</strong> {overbookingLabel}</p>
          ) : null}
        </div>

        <div className="card">
          <h3>Decor Scope</h3>
          <p><strong>Colors / Theme:</strong> {inquiry.colors_theme ?? "—"}</p>
          <p><strong>Selected Decor Elements:</strong></p>
          <div className="summary-pills">
            {selectedDecorCategories.length ? (
              selectedDecorCategories.map((category) => (
                <span key={category} className="summary-chip">{category.replace(/_/g, " ")}</span>
              ))
            ) : (
              <p className="muted">No decor elements selected yet.</p>
            )}
          </div>
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
          {linkedContract ? (
            <>
              <p><strong>Contract:</strong> {linkedContract.contract_status ?? "draft"}</p>
              <p><strong>Deposit:</strong> {linkedContract.deposit_paid ? "Paid" : "Pending"}</p>
              <p><strong>Remaining Balance:</strong> ${Number(linkedContract.balance_due ?? 0).toLocaleString()}</p>
            </>
          ) : null}
        </div>

        <div className="card">
          <h3>Client Vision Summary</h3>
          <div className="admin-vision-summary">
            <div className="admin-vision-block">
              <strong>Inspiration Notes</strong>
              <p>{inquiry.inspiration_notes ?? "—"}</p>
            </div>
            <div className="admin-vision-block">
              <strong>Additional Info</strong>
              <p>{inquiry.additional_info ?? "—"}</p>
            </div>
            <div className="admin-vision-block">
              <strong>All Uploaded Inspiration</strong>
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
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Decor Selection Review</h3>
          {decorSelections.length ? (
            <div className="admin-decor-selection-list">
              {decorSelections.map((selection) => {
                const selectedImages = selection.selectedGalleryImages ?? [];
                const uploadedImages = selection.uploadedImageUrls ?? [];

                return (
                  <div key={selection.categoryKey} className="admin-decor-selection-card">
                    <div className="admin-decor-selection-head">
                      <strong>{selection.categoryTitle}</strong>
                      <span>
                        {selectedImages.length + uploadedImages.length
                          ? `${selectedImages.length + uploadedImages.length} visual reference${selectedImages.length + uploadedImages.length === 1 ? "" : "s"}`
                          : "Notes only"}
                      </span>
                    </div>

                    {selectedImages.length ? (
                      <div className="admin-decor-selection-images">
                        {selectedImages.map((image) => (
                          <a key={image.id} href={image.image_url} target="_blank" rel="noreferrer">
                            <img src={image.image_url} alt={image.title} />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {uploadedImages.length ? (
                      <div className="admin-decor-selection-images admin-decor-selection-images--uploads">
                        {uploadedImages.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`${selection.categoryTitle} uploaded inspiration`} />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {selection.notes ? (
                      <div className="admin-vision-block admin-vision-block--note">
                        <strong>Client note</strong>
                        <p>{selection.notes}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">No structured visual selections were submitted.</p>
          )}
        </div>
      </div>

      <div id="next-action" style={{ marginTop: "24px" }} className="card">
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
        <BookingLifecycleForm
          inquiryId={inquiry.id}
          initialBookingStage={bookingStage}
          initialFloorPlanReceived={Boolean(inquiry.floor_plan_received)}
          initialWalkthroughCompleted={Boolean(inquiry.walkthrough_completed)}
          eventDate={inquiry.event_date ?? null}
          otherEventsOnDate={otherEventsOnDate}
        />
        <ConsultationManagementForm
          inquiryId={inquiry.id}
          initialConsultationStatus={inquiry.consultation_status ?? "not_scheduled"}
          initialConsultationType={inquiry.consultation_type ?? null}
          initialConsultationAt={inquiry.consultation_at ?? null}
          initialFollowUpAt={inquiry.follow_up_at ?? null}
          initialQuoteResponseStatus={inquiry.quote_response_status ?? "not_sent"}
        />
        <div id="quote-stage">
        <QuoteManagementForm
          inquiryId={inquiry.id}
          currentAmount={inquiry.estimated_price ?? null}
          clientEmail={inquiry.email ?? null}
          clientName={`${inquiry.first_name} ${inquiry.last_name}`}
          eventType={inquiry.event_type ?? null}
          eventDate={inquiry.event_date ?? null}
          catalogItems={pricingCatalogItems ?? []}
          initialPricing={inquiryQuotePricing ?? null}
          initialLineItems={inquiryQuoteLineItems ?? []}
        />
        </div>
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
