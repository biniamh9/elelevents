import Link from "next/link";
import { notFound } from "next/navigation";
import ItemizedPricePreview from "@/components/forms/admin/itemized-price-preview";
import {
  getQuoteDocumentByInquiryId,
  mapQuoteDocumentToLegacyLineItems,
  mapQuoteDocumentToLegacyPricing,
} from "@/lib/admin-documents";
import { buildInquiryDetailHref } from "@/lib/admin-navigation";
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

  const quoteDocument = await getQuoteDocumentByInquiryId(id);
  const pricing = mapQuoteDocumentToLegacyPricing(quoteDocument);
  const lineItems = mapQuoteDocumentToLegacyLineItems(quoteDocument);

  return (
    <main className="admin-page section">
      <div style={{ marginBottom: "20px" }}>
        <Link href={buildInquiryDetailHref(id)} className="btn secondary">
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
