import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import { getGalleryItems } from "@/lib/gallery";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

export default async function ContactPage() {
  const images = await getGalleryItems(4);

  return (
    <main className="container section public-page-shell">
      <CinematicHomeMotion />
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

      <section className="grid-2 public-note-grid" data-reveal>
        <Card data-reveal-child style={{ ["--reveal-delay" as string]: "80ms" }}>
          <h3>What happens next?</h3>
          <div className="contact-next-steps">
            <p><span>1</span> We review your event details and confirm the best way to start the consultation.</p>
            <p><span>2</span> We talk through the room, the focal points, and the level of styling you need.</p>
            <p><span>3</span> We refine the scope and prepare the quote and booking guidance clearly.</p>
          </div>
        </Card>

        <Card data-reveal-child style={{ ["--reveal-delay" as string]: "160ms" }}>
          <h3>Contact confidence</h3>
          <p className="muted">Email: yordecor@gmail.com</p>
          <p className="muted">Phone: 612-964-3553</p>
          <p className="muted">Service area: Atlanta, GA and surrounding areas</p>
          <p className="muted">Response time: usually within 1 to 2 business days</p>
          <div className="btn-row">
            <Button href="/request">Book Consultation</Button>
          </div>
        </Card>
      </section>

      <section data-reveal>
        <GalleryStrip
          title="A glimpse of the atmosphere we help clients create."
          items={images.slice(0, 4).map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            label: item.category,
          }))}
          showCaption={false}
        />
      </section>

      <PageCTA
        title="Share the event details and we’ll guide the next step clearly."
        description="If you already know the date, venue, or decor direction, booking the consultation now helps secure the clearest path forward."
        showSecondary={false}
      />
    </main>
  );
}
