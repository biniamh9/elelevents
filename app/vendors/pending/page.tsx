import { redirect } from "next/navigation";
import { getCurrentVendorContext } from "@/lib/auth/vendor";

export default async function VendorPendingPage() {
  const { user, vendor } = await getCurrentVendorContext();

  if (!user || !vendor) {
    redirect("/vendors/login");
  }

  if (vendor.approval_status === "approved" && vendor.is_active) {
    redirect("/vendors/dashboard");
  }

  return (
    <main className="container section">
      <div className="card form-card" style={{ maxWidth: "720px", margin: "32px auto" }}>
        <p className="eyebrow">Vendor approval</p>
        <h2>Your account is still under review.</h2>
        <p className="lead">
          We review vendor quality manually before sending leads. That is the correct
          tradeoff. Open marketplaces fill up with junk vendors fast.
        </p>
        <div className="grid-2">
          <div className="card">
            <h3>Status</h3>
            <p className="muted">Current approval status: {vendor.approval_status}</p>
          </div>
          <div className="card">
            <h3>What happens next</h3>
            <p className="muted">
              Once approved, you can sign in and see referral opportunities assigned to your business.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
