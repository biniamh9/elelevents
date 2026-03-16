import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VendorsLandingPage() {
  return (
    <main className="container section">
      <section className="page-hero card">
        <div className="page-hero-copy">
          <p className="eyebrow">Vendor partners</p>
          <h1>Join the referral network behind Elel Events.</h1>
          <p className="lead">
            Approved partners can receive curated leads for catering, photography,
            venues, planning, sound, and related event services.
          </p>
          <div className="booking-actions">
            <Link href="/vendors/apply" className="btn">
              Apply as a vendor
            </Link>
            <Link href="/vendors/login" className="btn secondary">
              Vendor sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: "24px" }}>
        <div className="card">
          <p className="eyebrow">How it works</p>
          <h3>Simple approval flow</h3>
          <p className="muted">
            Apply with your business information, wait for approval, then sign in
            to review the referrals sent to you.
          </p>
        </div>

        <div className="card">
          <p className="eyebrow">What to expect</p>
          <h3>Curated lead access</h3>
          <p className="muted">
            This is not an open marketplace. Vendors are reviewed first so clients
            see a smaller, more trusted list of partners.
          </p>
        </div>
      </section>
    </main>
  );
}
