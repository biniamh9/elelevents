import Link from "next/link";
import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";

const luxuryNotes = [
  "Reception styling",
  "Traditional Melsi decor",
  "Luxury sweetheart tables",
  "Entrance moments",
  "Guest-table rhythm",
];

const promisePoints = [
  {
    title: "Luxury rooms, not random pieces",
    text: "The room should feel composed from the entrance to the head table, not assembled item by item with no visual rhythm.",
  },
  {
    title: "Consultation before quote",
    text: "The process stays personal. We talk through the room, the venue, and the priorities first, then quote with clarity.",
  },
  {
    title: "Booking flow that feels premium",
    text: "Inquire, consult, quote, contract, and confirm without turning the client journey into admin clutter.",
  },
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const packages = await getPackages(3);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const leadImage = galleryPreview[0]?.image_url;
  const sideImage = galleryPreview[1]?.image_url;
  const detailImage = galleryPreview[2]?.image_url;
  const storyImage = galleryPreview[3]?.image_url;
  const mosaicImages = galleryPreview.slice(0, 4);

  return (
    <main className="home-shell home-shell--editorial">
      <div className="home-veil" />

      <section className="hero-stage">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="container hero-stage-grid">
          <div className="hero-stage-copy">
            <p className="eyebrow">Elel Events & Design</p>
            <div className="hero-stage-kicker">
              <span>Luxury decor studio</span>
              <span>Wedding, reception, and Melsi</span>
            </div>
            <h1>
              Rooms that look
              <br />
              <em>saved to a board</em>
              <br />
              before the event
              <br />
              even begins.
            </h1>
            <p className="hero-stage-lead">
              This should feel less like a local brochure and more like an
              elevated decor brand with a clean booking system attached to it.
            </p>

            <div className="btn-row">
              <Link href="/request" className="btn">
                Start Your Quote
              </Link>
              <Link href="/gallery" className="btn secondary">
                Browse the Work
              </Link>
            </div>

            <div className="hero-stage-meta">
              <div>
                <span>Focus</span>
                <strong>Head tables, backdrops, guest-table styling, entrance decor, and full-room atmosphere.</strong>
              </div>
              <div>
                <span>Process</span>
                <strong>Inquiry, consultation, quote, contract, and confirmation without losing the luxury feel.</strong>
              </div>
            </div>
          </div>

          <div className="hero-stage-visual">
            <div className="hero-stage-card hero-stage-card--tall">
              <img src={leadImage} alt="Luxury event setup by Elel Events" />
            </div>
            <div className="hero-stage-stack">
              <div className="hero-stage-card hero-stage-card--wide">
                <img src={sideImage} alt="Styled reception design" />
              </div>
              <div className="hero-stage-note card">
                <p className="eyebrow">What should stand out</p>
                <strong>
                  The room should feel finished, layered, and calm, not busy.
                </strong>
              </div>
              <div className="hero-stage-card hero-stage-card--detail">
                <img src={detailImage} alt="Styled decor detail" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="luxury-marquee" aria-label="Decor categories">
          {luxuryNotes.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="story-split">
          <div className="story-split-copy">
            <p className="eyebrow">The pitch</p>
            <h2>
              Pinterest energy,
              <br />
              luxury restraint,
              <br />
              and a booking path
              <br />
              that still makes sense.
            </h2>
            <p className="lead">
              The website should sell the mood as much as the service. That
              means stronger imagery, more editorial spacing, less generic
              “business site” structure, and one clear path into the quote flow.
            </p>
          </div>

          <div className="story-split-visual">
            <img src={storyImage} alt="Event room styled by Elel Events" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="promise-gallery">
          <div className="promise-gallery-copy card">
            <p className="eyebrow">What makes it different</p>
            <h2>
              A decor brand should look curated before the client ever fills out
              the form.
            </h2>
            <div className="promise-stack">
              {promisePoints.map((item) => (
                <div key={item.title} className="promise-item">
                  <h3>{item.title}</h3>
                  <p className="muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="promise-gallery-mosaic">
            {mosaicImages.map((item, index) => (
              <div key={item.id} className={`promise-photo promise-photo--${index + 1}`}>
                <img src={item.image_url} alt={item.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="process-runway card">
          <div className="process-runway-head">
            <p className="eyebrow">Booking system</p>
            <h2>Visual enough to sell. Clear enough to book.</h2>
          </div>

          <div className="process-runway-grid">
            <div className="process-runway-step">
              <span>01</span>
              <h3>Submit the event request</h3>
              <p className="muted">Share the room, the date, the guest count, and the decor direction.</p>
            </div>
            <div className="process-runway-step">
              <span>02</span>
              <h3>Refine during consultation</h3>
              <p className="muted">Talk through venue rules, priorities, focal points, and the final room direction.</p>
            </div>
            <div className="process-runway-step">
              <span>03</span>
              <h3>Quote, contract, and secure</h3>
              <p className="muted">Once the details are real, the quote and contract move fast and cleanly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="package-salon">
          <div className="package-salon-intro">
            <p className="eyebrow">Packages</p>
            <h2>Start with a styling direction, then tailor the room from there.</h2>
          </div>

          <div className="package-salon-grid">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`package-card package-card--salon ${index === 1 ? "featured" : ""}`}
              >
                <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
                <h3>{pkg.name}</h3>
                <p className="muted">
                  {pkg.summary ??
                    pkg.best_for ??
                    "Custom decor support tailored to your event."}
                </p>
                <span className="package-card-link">See package details</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="card cta-shell cta-shell--editorial">
          <div>
            <span className="eyebrow">Ready to begin</span>
            <h2>Tell us about the event and we’ll shape the next step around the room you want.</h2>
            <p className="lead">
              Start the request. We’ll review the scope, confirm the consultation,
              and move you toward quote and contract without losing the feeling.
            </p>
          </div>

          <div className="btn-row">
            <Link href="/request" className="btn">
              Request a Quote
            </Link>
            <Link href="/gallery" className="btn secondary">
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      <div className="footer container">
        © 2026 Elel Events. Elegant design for meaningful celebrations.
      </div>
    </main>
  );
}
