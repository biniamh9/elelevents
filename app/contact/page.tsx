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
          <h3>What happens next?</h3>
          <div className="contact-next-steps">
            <p><span>1</span> We review your event details and confirm the best way to start the consultation.</p>
            <p><span>2</span> We talk through the room, the focal points, and the level of styling you need.</p>
            <p><span>3</span> We refine the scope and prepare the quote and booking guidance clearly.</p>
          </div>
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
        </Card>
      </section>

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">Response time</p>
          <h3>Usually within 1 to 2 business days</h3>
          <p className="muted">
            We respond as quickly as possible and confirm the next step clearly so you know what to expect.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Service area</p>
          <h3>Atlanta, GA and surrounding areas</h3>
          <p className="muted">
            Based in Atlanta and available for celebrations across the metro area and nearby communities.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Booking guidance</p>
          <h3>Early consultation is best</h3>
          <p className="muted">
            Weekend and holiday dates book earlier, so it helps to reach out once you have a date or venue direction.
          </p>
        </Card>
      </section>

      <GalleryStrip
        title="A glimpse of the atmosphere we help clients create."
        items={images.slice(0, 4).map((item) => ({
          id: item.id,
          imageUrl: item.image_url,
          title: item.title,
          label: item.category,
        }))}
      />

      <PageCTA
        title="Share the event details and we’ll guide the next step clearly."
        description="If you already know the date, venue, or decor direction, booking the consultation now helps secure the clearest path forward."
      />
    </main>
  );
}
