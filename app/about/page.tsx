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
              <strong>Story-led event atmospheres</strong>
              <p className="muted">From elegant wedding receptions to traditional Melsi celebrations and milestone events, every detail is thoughtfully curated to reflect each client&apos;s vision.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>02</span>
              <div>
              <strong>Reputation built on trust</strong>
              <p className="muted">Clients consistently highlight our professionalism, reliability, and attention to detail, and we are proud to say our work speaks for itself.</p>
              </div>
            </div>
            <div className="booking-note">
              <span>03</span>
              <div>
              <strong>Consistency without compromise</strong>
              <p className="muted">We have built our reputation on trust, consistency, and delivering exactly what we promise, with zero complaints and countless satisfied clients.</p>
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

      <section className="simple-proof-band">
        <Card className="simple-proof-card">
          <p className="eyebrow">Origin story</p>
          <h3>Minnesota foundation</h3>
          <p className="muted">
            Our early work in Minnesota established the creative discipline,
            professionalism, and client care that still define the brand today.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Atlanta presence</p>
          <h3>Serving Atlanta since 2019</h3>
          <p className="muted">
            Since relocating to Atlanta, we have continued designing wedding
            receptions, Traditional Melsi celebrations, and milestone events with
            a refined, client-centered approach.
          </p>
        </Card>
        <Card className="simple-proof-card">
          <p className="eyebrow">Reputation</p>
          <h3>Professional, reliable, detail-driven</h3>
          <p className="muted">
            Clients consistently highlight our professionalism, reliability, and
            attention to detail, and our five-star feedback reflects that trust.
          </p>
        </Card>
      </section>

      <section className="grid-2 public-note-grid">
        <Card>
          <h3>Design philosophy</h3>
          <p className="muted">
            Our signature style is elegant, warm, and layered. We focus on focal points, balanced rooms, and details that photograph beautifully without feeling crowded.
          </p>
        </Card>
        <Card>
          <h3>Why choose us</h3>
          <p className="muted">
            Clients choose Elel Events for experience, reliability, professional communication, and a five-star reputation built over years of trusted work.
          </p>
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
      />
    </main>
  );
}
