import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireVendorPage } from "@/lib/auth/vendor";
import VendorReferralResponseForm from "@/components/forms/vendor/vendor-referral-response-form";

export const dynamic = "force-dynamic";

function formatMoney(value: number | null) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 });
}

export default async function VendorDashboardPage() {
  const { vendor } = await requireVendorPage();

  const { data: referrals, error } = await supabaseAdmin
    .from("vendor_referrals")
    .select(`
      id,
      created_at,
      category,
      status,
      fee_amount,
      intro_message,
      inquiry:event_inquiries(
        id,
        first_name,
        last_name,
        event_type,
        event_date,
        venue_name,
        guest_count,
        colors_theme,
        vendor_request_notes
      )
    `)
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const openCount = referrals?.filter((item) => item.status === "sent" || item.status === "viewed").length ?? 0;
  const acceptedCount = referrals?.filter((item) => item.status === "accepted" || item.status === "charged").length ?? 0;
  const revenueDue = referrals
    ?.filter((item) => item.status === "accepted")
    .reduce((sum, item) => sum + Number(item.fee_amount ?? 0), 0) ?? 0;

  return (
    <main className="admin-page section">
      <div className="section-heading">
        <p className="eyebrow">Vendor dashboard</p>
        <h1>Referral opportunities</h1>
        <p className="lead">
          Review referred clients, respond quickly, and keep accepted lead fees visible.
        </p>
      </div>

      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <div className="card metric-card metric-card--neutral">
          <p className="muted">Open referrals</p>
          <strong>{openCount}</strong>
          <span>New leads waiting for a response</span>
        </div>
        <div className="card metric-card metric-card--neutral">
          <p className="muted">Accepted</p>
          <strong>{acceptedCount}</strong>
          <span>Leads you have accepted so far</span>
        </div>
        <div className="card metric-card metric-card--neutral">
          <p className="muted">Fees due</p>
          <strong>${formatMoney(revenueDue)}</strong>
          <span>Tracked internally until billing is automated</span>
        </div>
      </div>

      {error ? <p className="error">Failed to load referrals: {error.message}</p> : null}

      <div style={{ display: "grid", gap: "18px" }}>
        {referrals?.length ? referrals.map((referral) => {
          const inquiry = Array.isArray(referral.inquiry) ? referral.inquiry[0] : referral.inquiry;

          return (
            <div key={referral.id} className="card">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">{referral.category}</p>
                  <h3>
                    {inquiry?.first_name} {inquiry?.last_name}
                  </h3>
                </div>
                <span className="summary-chip">Status: {referral.status}</span>
              </div>

              <div className="grid-2">
                <div>
                  <p><strong>Event type:</strong> {inquiry?.event_type ?? "—"}</p>
                  <p><strong>Event date:</strong> {inquiry?.event_date ?? "—"}</p>
                  <p><strong>Venue:</strong> {inquiry?.venue_name ?? "—"}</p>
                  <p><strong>Guest count:</strong> {inquiry?.guest_count ?? "—"}</p>
                </div>
                <div>
                  <p><strong>Color / theme:</strong> {inquiry?.colors_theme ?? "—"}</p>
                  <p><strong>Admin intro:</strong> {referral.intro_message ?? "—"}</p>
                  <p><strong>Referral fee:</strong> ${formatMoney(referral.fee_amount)}</p>
                  <p><strong>Vendor notes:</strong> {inquiry?.vendor_request_notes ?? "—"}</p>
                </div>
              </div>

              <VendorReferralResponseForm
                referralId={referral.id}
                currentStatus={referral.status}
              />
            </div>
          );
        }) : (
          <div className="card">
            <h3>No referrals yet</h3>
            <p className="muted">
              Once the admin team refers a customer inquiry to your business, it will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
