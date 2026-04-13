import VendorManagement from "@/components/forms/admin/vendor-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const { data, error } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, business_name, contact_name, email, phone, service_categories, approval_status, membership_status, default_referral_fee, city, state, service_area, is_active, admin_notes")
    .order("created_at", { ascending: false });

  const totalVendors = data?.length ?? 0;
  const activeVendors = data?.filter((item) => item.is_active).length ?? 0;
  const pendingVendors =
    data?.filter((item) => item.approval_status === "pending").length ?? 0;
  const approvedVendors =
    data?.filter((item) => item.approval_status === "approved").length ?? 0;

  return (
    <main className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Vendor partners</p>
          <h1>Approve and manage referral vendors</h1>
          <p className="lead">
          Keep the partner network curated. Bad vendors damage your brand faster than almost anything else.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total vendors: {totalVendors}</span>
          <span className="admin-head-pill">Pending: {pendingVendors}</span>
          <span className="admin-head-pill">Approved: {approvedVendors}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Use this view to keep the partner network active, approved, and brand-safe.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Total vendors</p>
            <strong>{totalVendors}</strong>
            <span>Partner records</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Active vendors</p>
            <strong>{activeVendors}</strong>
            <span>Currently usable</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Pending review</p>
            <strong>{pendingVendors}</strong>
            <span>Waiting for approval</span>
          </div>
          <div className="card metric-card metric-card--neutral">
            <p className="muted">Approved</p>
            <strong>{approvedVendors}</strong>
            <span>Ready for referrals</span>
          </div>
        </div>
      </section>

      {error ? <p className="error">Failed to load vendors: {error.message}</p> : null}
      <VendorManagement items={data ?? []} />
    </main>
  );
}
