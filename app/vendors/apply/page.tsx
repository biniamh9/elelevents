import VendorApplicationForm from "@/components/forms/vendor/vendor-application-form";

export default function VendorApplyPage() {
  return (
    <main className="container section public-page-shell">
      <div className="section-heading page-hero-copy">
        <p className="eyebrow">Vendor partners</p>
        <h1>Apply to join the referral network.</h1>
        <p className="lead">
          This is for curated partners only. If the service quality is weak or inconsistent,
          it should not be in the network.
        </p>
      </div>

      <VendorApplicationForm />
    </main>
  );
}
