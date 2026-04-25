import Link from "next/link";

import CinematicHomeMotion from "@/components/site/cinematic-home-motion";
import Button from "@/components/ui/button";
import { getGalleryItems, normalizeGalleryCategory, normalizeGalleryTitle } from "@/lib/gallery";
import { getRentalItems } from "@/lib/rentals";
import { getTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

const processSteps = [
  {
    number: "01",
    title: "Submit Your Vision",
    description: "Share the celebration, atmosphere, and date you have in mind so we can shape the right starting point.",
  },
  {
    number: "02",
    title: "Design Consultation",
    description: "We align on room direction, focal moments, guest flow, and the visual priorities that matter most.",
  },
  {
    number: "03",
    title: "Custom Proposal",
    description: "You receive a polished proposal with design scope, pricing direction, and the next booking steps.",
  },
  {
    number: "04",
    title: "Secure Your Date",
    description: "Once the agreement and deposit are complete, your event moves into confirmed production planning.",
  },
  {
    number: "05",
    title: "Event Day Magic",
    description: "Walk into a room that feels finished, cohesive, and unforgettable from first look to final photograph.",
  },
];

function derivePortfolioLocation(category: string) {
  if (category.includes("Wedding")) return "Atlanta, Georgia";
  if (category.includes("Traditional")) return "Metro Atlanta";
  if (category.includes("Corporate")) return "Buckhead";
  return "Greater Atlanta";
}

function derivePortfolioStyle(category: string, title: string) {
  const source = `${category} ${title}`.toLowerCase();
  if (source.includes("traditional") || source.includes("melsi")) return "Cultural elegance";
  if (source.includes("baby")) return "Soft luxury";
  if (source.includes("bridal")) return "Romantic editorial";
  if (source.includes("birthday")) return "Modern celebration";
  return "Timeless romance";
}

export default async function HomePage() {
  const [galleryItems, testimonials, featuredRentals, fallbackRentals] = await Promise.all([
    getGalleryItems(8),
    getTestimonials(5),
    getRentalItems({ activeOnly: true, featuredOnly: true, limit: 12 }),
    getRentalItems({ activeOnly: true, limit: 12 }),
  ]);

  const portfolioItems = galleryItems.slice(0, 4).map((item, index) => {
    const categoryLabel = normalizeGalleryCategory(item.category);
    const title = normalizeGalleryTitle(item.title, `Featured Event ${index + 1}`);

    return {
      ...item,
      title,
      categoryLabel,
      location: derivePortfolioLocation(categoryLabel),
      styleTag: derivePortfolioStyle(categoryLabel, title),
    };
  });

  const featuredTestimonials = testimonials.slice(0, 3);
  const featuredRentalCandidates = featuredRentals
    .filter((item) => item.active && item.available_quantity > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const fallbackRentalCandidates = fallbackRentals
    .filter((item) => item.active && item.available_quantity > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const homepageRentals =
    featuredRentalCandidates.length >= 3
      ? featuredRentalCandidates.slice(0, 3)
      : fallbackRentalCandidates.slice(0, 3);

  return (
    <main className="cinematic-homepage">
      <CinematicHomeMotion />
      <section className="cinematic-hero">
        <div className="cinematic-hero__media" aria-hidden="true">
          <img src="/hero1.jpeg" alt="" className="cinematic-hero__image" />
          <div className="cinematic-hero__overlay" />
        </div>

        <div className="container cinematic-hero__shell">
          <div className="cinematic-hero__content">
            <span className="cinematic-hero__eyebrow cinematic-hero__reveal cinematic-hero__reveal--1">
              Luxury Wedding Design in Atlanta
            </span>
            <h1 className="cinematic-hero__headline cinematic-hero__reveal cinematic-hero__reveal--2">
              <span>Where Moments</span>
              <span>Become Masterpieces</span>
            </h1>
            <p className="cinematic-hero__reveal cinematic-hero__reveal--3">
              We don&apos;t just decorate spaces. We design experiences your guests will remember
              for a lifetime, with layered styling, editorial polish, and a room reveal that feels
              as emotional as the celebration itself.
            </p>

            <div className="cinematic-hero__actions cinematic-hero__reveal cinematic-hero__reveal--4">
              <Button href="/request">Check Your Date Availability</Button>
              <Button href="/gallery" variant="secondary" arrow>
                Explore Our Work
              </Button>
            </div>

            <div className="cinematic-hero__trust cinematic-hero__reveal cinematic-hero__reveal--5">
              <span>Luxury weddings</span>
              <span>Refined cultural celebrations</span>
              <span>Limited events each month</span>
            </div>
          </div>

          <div className="cinematic-scroll-indicator" aria-hidden="true">
            <span />
            <small>Scroll</small>
          </div>
        </div>
      </section>

      <section className="cinematic-section" data-reveal>
        <div className="container cinematic-shell">
          <div className="cinematic-section__head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
            <span>Portfolio</span>
            <h2>Real Events. Real Transformations.</h2>
            <p>Every design tells a story. Step inside ours.</p>
          </div>

          <div className="cinematic-portfolio-grid">
            {portfolioItems.map((item, index) => (
              <article
                key={item.id}
                className={`cinematic-portfolio-card cinematic-portfolio-card--${index === 0 ? "hero" : index === 3 ? "wide" : "standard"}`}
                data-reveal-child
                style={{ ["--reveal-delay" as string]: `${120 + index * 110}ms` }}
              >
                <img src={item.image_url} alt={item.title} />
                <div className="cinematic-portfolio-card__overlay" />
                <div className="cinematic-portfolio-card__content">
                  <div className="cinematic-portfolio-card__meta">
                    <span>{item.location}</span>
                    <span>{item.styleTag}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <Link href={`/gallery/${item.id}`} className="cinematic-portfolio-card__link">
                    View Experience
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cinematic-section cinematic-section--dark" id="process" data-reveal>
        <div className="container cinematic-shell">
          <div className="cinematic-process-head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
            <span>Our Process</span>
            <h2>Every step is designed to feel calm, clear, and elevated.</h2>
          </div>

          <div className="cinematic-process-track" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
            {processSteps.map((step, index) => (
              <article
                key={step.number}
                className="cinematic-process-step"
                data-reveal-child
                style={{ ["--reveal-delay" as string]: `${180 + index * 110}ms` }}
              >
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cinematic-section" data-reveal>
        <div className="container cinematic-shell cinematic-shell--split">
          <div className="cinematic-limited" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
            <span>Limited Availability</span>
            <h2>We accept a limited number of events each month.</h2>
            <p>
              We keep our calendar intentionally selective so every wedding receives the design
              attention, planning discipline, and installation care it deserves.
            </p>
            <div className="cinematic-limited__actions">
              <Button href="/request">Check Your Date Availability</Button>
              <Button href="/contact" variant="secondary">
                Book Consultation
              </Button>
            </div>
          </div>

          <div className="cinematic-proof-grid">
            {featuredTestimonials.map((item, index) => (
              <article
                key={item.id}
                className="cinematic-proof-card"
                data-reveal-child
                style={{ ["--reveal-delay" as string]: `${120 + index * 110}ms` }}
              >
                <p>{item.highlight ?? item.quote}</p>
                <div>
                  <strong>{item.reviewer_name}</strong>
                  <span>{item.event_type ?? "Celebration"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {homepageRentals.length ? (
        <section className="cinematic-section cinematic-section--white" data-reveal>
          <div className="container cinematic-shell">
            <div className="cinematic-section__head" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
              <span>Rentals</span>
              <h2>Quote-ready rentals for events that need seating and focal pieces.</h2>
              <p>Browse in-stock inventory or request a rental-specific quote without entering the full design flow.</p>
            </div>

            <div className="cinematic-rental-strip">
              {homepageRentals.map((item, index) => (
                <article
                  key={item.id}
                  className="cinematic-rental-card"
                  data-reveal-child
                  style={{ ["--reveal-delay" as string]: `${120 + index * 110}ms` }}
                >
                  <Link href={`/rentals/${item.slug}`} className="cinematic-rental-card__media">
                    {item.featured_image_url ? (
                      <img src={item.featured_image_url} alt={item.name} />
                    ) : (
                      <div className="cinematic-rental-card__placeholder">Rental item</div>
                    )}
                  </Link>
                  <div className="cinematic-rental-card__copy">
                    <span>{item.category || "Rental"}</span>
                    <h3>{item.name}</h3>
                    <p>{item.short_description || "Premium rental inventory available for quote."}</p>
                    <div className="cinematic-rental-card__actions">
                      <Button href={`/rentals/${item.slug}`} variant="secondary" arrow>
                        View Rental
                      </Button>
                      <Button href={`/rentals/request?item=${item.slug}`}>Request Quote</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="cinematic-final-cta" data-reveal>
        <div className="container">
          <div className="cinematic-final-cta__shell" data-reveal-child>
            <span>Begin your event journey</span>
            <h2>Design a celebration that feels unforgettable the moment your guests arrive.</h2>
            <p>
              Share your vision, your date, and the atmosphere you want to create. We&apos;ll
              shape the next step with clarity and intention.
            </p>
            <small className="cinematic-final-cta__microcopy">
              We accept a limited number of events each month.
            </small>
            <div className="cinematic-final-cta__actions">
              <Button href="/request">Check Your Date Availability</Button>
              <Button href="/gallery" variant="secondary" arrow>
                Explore Our Work
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
