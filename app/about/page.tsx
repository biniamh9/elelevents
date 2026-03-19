import ImmersivePageHero from "@/components/site/immersive-page-hero";
import StorySection from "@/components/site/story-section";
import GalleryStrip from "@/components/site/gallery-strip";
import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";
import { getGalleryItems } from "@/lib/gallery";
import { getTestimonials } from "@/lib/testimonials";

export default async function AboutPage() {
  const images = await getGalleryItems(6);
  const testimonials = await getTestimonials(3);

  return (
    <main className="container section public-page-shell">
      <ImmersivePageHero
        eyebrow="About Elel Events"
        title="Elegant celebrations shaped with warmth, precision, and visual care."
        description="Elel Events & Design creates wedding receptions, Traditional Melsi celebrations, and milestone events that feel intentional, welcoming, and unforgettable."
        imageUrl={images[0]?.image_url}
        imageAlt="Elel Events luxury reception setup"
        tags={["12+ years", "Minnesota roots", "Atlanta since 2019"]}
        aside={
          <Card className="booking-intro-notes">
            <div className="booking-note">
              <span>01</span>
              <div>
                <strong>12+ years of design experience</strong>
                <p className="muted">A long-standing reputation built through calm communication and dependable execution.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
                <strong>Minnesota roots, Atlanta since 2019</strong>
                <p className="muted">The same attention to detail now shapes receptions and celebrations across Atlanta.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
                <strong>Trusted by satisfied clients</strong>
                <p className="muted">Our work is known for professionalism, reliability, and a clean finished room.</p>
              </div>
            </div>
          </Card>
        }
      />

      <StorySection
        eyebrow="Our story"
        title="From Minnesota beginnings to Atlanta celebrations."
        description="Our journey began in Minnesota, where we built a strong foundation rooted in creativity, client care, and dependable execution. Since relocating to Atlanta in 2019, we have continued to design celebrations with the same professionalism and detail-led approach."
        imageUrl={images[1]?.image_url ?? images[0]?.image_url}
        imageAlt="Decorated head table by Elel Events"
        tags={["Head table", "Room reveal", "Guest experience"]}
      >
        <div className="story-feature-points">
          <Card>
            <h3>Emotion first</h3>
            <p className="muted">
              We design rooms that feel calm, beautiful, and memorable the moment clients walk in.
            </p>
          </Card>
          <Card>
            <h3>Founder-led care</h3>
            <p className="muted">
              Led by Yordi, each event is guided with thoughtful communication and close attention to detail.
            </p>
          </Card>
        </div>
      </StorySection>

      <section className="public-callout-grid">
        <Card className="public-callout-card">
          <p className="eyebrow">Design philosophy</p>
          <h3>Elegant, warm, and photographable.</h3>
          <p>We focus on focal points, balanced rooms, and layered details that never feel overcrowded.</p>
        </Card>
        <Card className="public-callout-card">
          <p className="eyebrow">How clients describe us</p>
          <h3>Professional, reliable, and detail-driven.</h3>
          <p>Clients trust the process because communication stays clear and the finished room feels polished.</p>
        </Card>
        <Card className="public-callout-card">
          <p className="eyebrow">What we create</p>
          <h3>Reception, Melsi, and milestone atmospheres.</h3>
          <p>Every room is shaped to feel welcoming, intentional, and beautiful the moment guests arrive.</p>
        </Card>
      </section>

      <GalleryStrip
        title="A closer look at the details that shape the room."
        items={images.slice(2, 5).map((item) => ({
          id: item.id,
          imageUrl: item.image_url,
          title: item.title,
          label: item.category,
        }))}
        showCaption={false}
      />

      <section className="simple-testimonial-shell">
        <div className="simple-testimonial-head">
          <div>
            <p className="eyebrow">Client reviews</p>
            <h2>What clients remember most</h2>
          </div>
        </div>
        <div className="simple-testimonial-grid">
          {testimonials.map((item) => (
            <Card key={item.id} as="article" className="testimonial-card">
              <div className="testimonial-card-top">
                <span className="testimonial-stars">{"★".repeat(item.rating ?? 5)}</span>
                <span className="testimonial-source">{item.source_label || "Google review"}</span>
              </div>
              <p className="testimonial-quote">“{item.highlight || item.quote}”</p>
              <div className="testimonial-meta">
                <strong>{item.reviewer_name}</strong>
                <small>{item.event_type || "Event client"}</small>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <PageCTA
        eyebrow="Work with us"
        title="Bring your event vision into a consultation that feels calm and clear."
        description="Share the event details, the atmosphere you want to create, and the focal points that matter most. We’ll guide the rest."
        showSecondary={false}
      />
    </main>
  );
}
