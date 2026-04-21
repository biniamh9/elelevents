import Button from "@/components/ui/button";
import { getGalleryItems } from "@/lib/gallery";
import { getHomeProcessSteps } from "@/lib/home-process";
import { getTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

const trustStats = [
  {
    value: "500+",
    label: "Events",
    detail: "Beautifully designed celebrations",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5 14.5 9l5 .7-3.6 3.5.9 5-4.3-2.3-4.3 2.3.9-5L4.5 9.7l5-.7L12 4.5Z" />
      </svg>
    ),
  },
  {
    value: "4.9",
    label: "Rating",
    detail: "Consistent client satisfaction",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 14.7 9l6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9L12 3.5Z" />
      </svg>
    ),
  },
  {
    value: "2019",
    label: "Atlanta Since",
    detail: "Serving celebrations across the city",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16M6 19V9l6-4 6 4v10M9 13h6M12 9v8" />
      </svg>
    ),
  },
  {
    value: "12+",
    label: "Years",
    detail: "Event design experience",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      </svg>
    ),
  },
];

const serviceCards = [
  {
    title: "Full-Service Event Design",
    description:
      "Design direction, focal moments, tablescapes, room flow, and finishing details handled as one cohesive visual story.",
    priceHint: "Starting at $4,500",
  },
  {
    title: "Wedding Decoration Packages",
    description:
      "Layered wedding styling packages for couples who want polished design with clear scope, timeline, and booking guidance.",
    priceHint: "Starting at $2,800",
  },
  {
    title: "Cultural Event Design",
    description:
      "Traditional and family-centered celebrations designed with cultural sensitivity, elegance, and guest experience in mind.",
    priceHint: "Custom pricing",
  },
];

export default async function HomePage() {
  const [galleryItems, processSteps, testimonials] = await Promise.all([
    getGalleryItems(8),
    getHomeProcessSteps(),
    getTestimonials(5),
  ]);

  const featuredPortfolio = galleryItems.slice(0, 4);
  const featuredTestimonials = testimonials.slice(0, 3);

  return (
    <main className="luxury-homepage">
      <section className="hero-stage hero-stage--timeless luxury-home-hero">
        <div className="luxury-home-hero-media" aria-hidden="true">
          <img
            src="/hero1.jpeg"
            alt=""
            className="luxury-home-hero-image"
          />
          <div className="luxury-home-hero-overlay" />
        </div>

        <div className="container luxury-home-hero-content">
          <span className="luxury-home-kicker">
            Atlanta&apos;s luxury event design studio
          </span>
          <h1>Designing Unforgettable Luxury Experiences</h1>
          <p>
            Elel Events &amp; Design creates elevated weddings and milestone
            celebrations with refined decor, thoughtful planning flow, and a
            calm, polished client experience from concept to event day.
          </p>
          <div className="luxury-home-hero-actions">
            <Button href="/request" className="luxury-home-primary-button">
              Book Consultation
            </Button>
            <Button href="/gallery" variant="secondary" className="luxury-home-secondary-button">
              View Portfolio
            </Button>
          </div>
        </div>
      </section>

      <section className="luxury-trust-bar" aria-label="Business trust indicators">
        <div className="container luxury-trust-grid">
          {trustStats.map((item) => (
            <article key={item.label} className="luxury-trust-card">
              <span className="luxury-trust-icon">{item.icon}</span>
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="luxury-home-section">
        <div className="container luxury-home-shell">
          <div className="luxury-home-section-head luxury-home-section-head--centered">
            <span>Our Process</span>
            <h2>A refined process that keeps every decision clear.</h2>
            <p>
              From first inquiry to installation day, every stage is designed
              to feel structured, collaborative, and beautifully managed.
            </p>
          </div>

          <div className="luxury-process-grid">
            {processSteps.slice(0, 5).map((step, index) => (
              <article key={step.id} className="luxury-process-card">
                <span className="luxury-process-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-home-section luxury-home-section--white">
        <div className="container luxury-home-shell">
          <div className="luxury-home-section-head">
            <span>Featured Portfolio</span>
            <h2>Signature event environments designed to feel unforgettable.</h2>
            <p>
              A glimpse into weddings and celebrations where atmosphere,
              elegance, and visual impact were treated as the center of the
              guest experience.
            </p>
          </div>

          <div className="luxury-portfolio-grid">
            {featuredPortfolio.map((item) => (
              <article key={item.id} className="luxury-portfolio-card">
                <div className="luxury-portfolio-image-wrap">
                  <img src={item.image_url} alt={item.title} />
                </div>
                <div className="luxury-portfolio-copy">
                  <span>{item.category ?? "Celebration"}</span>
                  <h3>{item.title}</h3>
                  <p>
                    Designed to feel layered, welcoming, and visually composed
                    from guest arrival through the final photo.
                  </p>
                  <Button href="/gallery" variant="secondary">
                    View Design
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-home-section">
        <div className="container luxury-home-shell">
          <div className="luxury-home-section-head">
            <span>Services</span>
            <h2>Design support tailored to the style and scale of your event.</h2>
            <p>
              Choose the service direction that matches your celebration, then
              refine the details with us through consultation and design
              planning.
            </p>
          </div>

          <div className="luxury-service-grid">
            {serviceCards.map((service) => (
              <article key={service.title} className="luxury-service-card">
                <span>{service.priceHint}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-home-section luxury-home-section--white">
        <div className="container luxury-home-shell">
          <div className="luxury-home-section-head">
            <span>Testimonials</span>
            <h2>Trusted by couples and families who wanted the room to feel extraordinary.</h2>
          </div>

          <div className="luxury-testimonial-grid">
            {featuredTestimonials.map((item) => (
              <article key={item.id} className="luxury-testimonial-card">
                <div className="luxury-testimonial-stars" aria-hidden="true">
                  {"★★★★★".slice(0, item.rating ?? 5)}
                </div>
                <p>{item.highlight ?? item.quote}</p>
                <div className="luxury-testimonial-meta">
                  <strong>{item.reviewer_name}</strong>
                  <span>{item.event_type ?? "Celebration"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-home-cta">
        <div className="container">
          <div className="luxury-home-cta-shell">
            <span>Limited Bookings</span>
            <h2>Let&apos;s Bring Your Vision to Life</h2>
            <p>
              We take on a limited number of events so every celebration
              receives the level of design attention it deserves.
            </p>
            <Button href="/request" className="luxury-home-primary-button">
              Book Consultation
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
