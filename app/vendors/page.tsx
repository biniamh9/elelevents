import ImmersivePageHero from "@/components/site/immersive-page-hero";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { getGalleryItems } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function VendorsLandingPage() {
  const images = await getGalleryItems(2);

  return (
    <main className="container section public-page-shell">
      <ImmersivePageHero
        eyebrow="Vendor partners"
        title="Join the referral network behind Elel Events."
        description="Approved partners can receive curated leads for catering, photography, venues, planning, sound, and related event services."
        imageUrl={images[0]?.image_url}
        imageAlt="Vendor support visual"
        tags={["Curated network", "Approved partners"]}
        aside={
          <Card className="gallery-page-note">
            <strong>Curated, not open marketplace</strong>
            <p className="muted">
              Vendors are reviewed first so clients see a smaller, more trusted list
              of partners instead of a crowded directory.
            </p>
          </Card>
        }
      />

      <div className="btn-row">
        <Button href="/vendors/apply">Apply as a vendor</Button>
        <Button href="/vendors/login" variant="secondary">Vendor sign in</Button>
      </div>

      <section className="grid-2" style={{ marginTop: "24px" }}>
        <Card>
          <p className="eyebrow">How it works</p>
          <h3>Simple approval flow</h3>
          <p className="muted">
            Apply with your business information, wait for approval, then sign in
            to review the referrals sent to you.
          </p>
        </Card>

        <Card>
          <p className="eyebrow">What to expect</p>
          <h3>Curated lead access</h3>
          <p className="muted">
            We review each partner application carefully so clients can receive
            recommendations from a smaller, more trusted network.
          </p>
        </Card>
      </section>
    </main>
  );
}
