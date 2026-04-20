import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import VendorManagement from "@/components/forms/admin/vendor-management";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  await requireAdminPage("operations");

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
  const { count: openReferrals = 0 } = await supabaseAdmin
    .from("vendor_referrals")
    .select("*", { count: "exact", head: true })
    .in("status", ["sent", "accepted"]);

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Vendors"
        description="Approve and manage referral vendors, keep the network curated, and monitor referral-ready partners."
      />

      <AdminMetricStrip
        items={[
          { label: "Total vendors", value: totalVendors, note: "Partner records in the workspace" },
          { label: "Active vendors", value: activeVendors, note: "Currently eligible for referral", tone: "green" },
          { label: "Pending review", value: pendingVendors, note: "Applications waiting for approval", tone: "amber" },
          { label: "Open referrals", value: openReferrals, note: "Referral requests still in progress", tone: "blue" },
        ]}
      />

      {error ? <p className="error">Failed to load vendors: {error.message}</p> : null}
      <VendorManagement items={data ?? []} />
    </main>
  );
}
