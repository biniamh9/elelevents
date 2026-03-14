import VendorManagement from "@/components/forms/admin/vendor-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const { data, error } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, contact_name, email, phone, service_categories, approval_status, membership_status, default_referral_fee, city, state, service_area, is_active, admin_notes")
    .order("created_at", { ascending: false });

  return (
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Vendor partners</p>
        <h1>Approve and manage referral vendors</h1>
        <p className="lead">
          Keep the partner network curated. Bad vendors damage your brand faster than almost anything else.
        </p>
      </div>

      {error ? <p className="error">Failed to load vendors: {error.message}</p> : null}
      <VendorManagement items={data ?? []} />
    </main>
  );
}
