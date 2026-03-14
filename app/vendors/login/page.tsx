import { redirect } from "next/navigation";
import VendorLoginForm from "@/components/forms/vendor/vendor-login-form";
import { getCurrentVendorContext } from "@/lib/auth/vendor";

export default async function VendorLoginPage() {
  const { user, vendor } = await getCurrentVendorContext();

  if (user && vendor?.approval_status === "approved" && vendor.is_active) {
    redirect("/vendors/dashboard");
  }

  if (user && vendor) {
    redirect("/vendors/pending");
  }

  return (
    <main className="container section">
      <div className="section-heading page-hero-copy">
        <p className="eyebrow">Vendor portal</p>
        <h1>Sign in to review referral leads.</h1>
        <p className="lead">
          Approved partners can review, accept, or decline referral opportunities here.
        </p>
      </div>

      <VendorLoginForm />
    </main>
  );
}
