import Link from "next/link";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import { getGalleryItems } from "@/lib/gallery";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default async function ContactPage() {
  const images = await getGalleryItems(4);

  return (
    <main className="container section public-page-shell">
      <ImmersivePageHero
        eyebrow="Contact"
        title="Start the conversation, then we’ll guide the next step clearly."
        description="If you are planning a wedding reception, Traditional Melsi celebration, or milestone event, we would love to hear from you. The best first step is to book a consultation so we can understand your event clearly."
        imageUrl={images[0]?.image_url}
        imageAlt="Elegant event detail"
        tags={["Atlanta", "Consultation", "Design guidance"]}
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>Email</strong>
                <p className="muted">yordecor@gmail.com</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Phone</strong>
                <p className="muted">612-964-3553</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>Service area</strong>
                <p className="muted">Based in Atlanta and serving celebrations across the metro area.</p>
              </div>
            </div>
          </Card>
        }
      />

      <StorySection
        eyebrow="What the process feels like"
        title="A calmer, clearer start to planning your event."
        description="We begin with the details that matter, talk through the atmosphere you want to create, and guide the next step in a way that feels thoughtful rather than rushed."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Decor consultation inspiration"
        reverse
        tags={["Vision", "Planning", "Atmosphere"]}
      />

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>What happens after you reach out?</h3>
          <p className="muted">
            We review the event details, follow up to confirm the consultation, and
            guide you through design direction, scope, and quote preparation. Most
            responses go out within 1 to 2 business days.
          </p>
        </Card>

        <Card>
          <h3>Need to see the work first?</h3>
          <p className="muted">
            Browse the portfolio to save the rooms, tables, and focal details that
            feel closest to your event vision.
          </p>
          <div className="btn-row">
            <Button href="/request">Book Consultation</Button>
            <Button href="/gallery" variant="secondary">View Portfolio</Button>
          </div>
          <div style={{ marginTop: "8px" }}>
            <Link href="/gallery" className="link-inline">
              Open portfolio
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
