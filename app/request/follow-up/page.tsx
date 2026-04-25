import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import RequestFollowUpForm from "@/components/forms/request-follow-up-form";
import Card from "@/components/ui/card";

export default async function RequestFollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string; email?: string; name?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container section public-page-shell public-page-shell--request">
      <CinematicHomeMotion />
      <ImmersivePageHero
        eyebrow="Inspiration Follow-up"
        title="Let’s Bring Your Vision to Life"
        description="Upload inspiration images, share Pinterest or Instagram links, and tell us the visual direction you want us to understand before we reply."
        imageUrl="/hero2.jpeg"
        imageAlt="Luxury event table setup"
        tags={["Inspiration upload", "Style direction", "Fast follow-up"]}
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>Add inspiration only if it helps</strong>
                <p className="muted">This step is optional and meant to clarify your taste, not slow you down.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Keep it visual</strong>
                <p className="muted">Pinterest boards, Instagram posts, and a few strong photos are enough.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>We reply quickly</strong>
                <p className="muted">Our team reviews new requests and follow-up details within 12–24 hours.</p>
              </div>
            </div>
          </Card>
        }
      />

      <RequestFollowUpForm
        inquiryId={params.inquiry ?? null}
        inquiryEmail={params.email ?? null}
        customerName={params.name ?? null}
      />
    </main>
  );
}
