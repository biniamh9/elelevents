import Link from "next/link";
import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";

const promisePoints = [
  {
    title: "Curated room composition",
    text: "Head table, backdrop, guest tables, entrance decor, and the visual rhythm of the whole room.",
  },
  {
    title: "Pinterest-worthy without chaos",
    text: "Layered, romantic, and polished, but still usable for a real event day and real venue rules.",
  },
  {
    title: "Luxury feel, clear process",
    text: "Inquiry, consultation, quote, contract, and payment flow without making the client feel lost.",
  },
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(5);
  const packages = await getPackages(3);
  const heroPrimary = galleryPreview[0]?.image_url;
  const heroSecondary = galleryPreview[1]?.image_url;
  const heroAccent = galleryPreview[2]?.image_url;
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);

  return (
    <main className="home-shell">
      <div className="home-veil" />

      <section className="container hero hero--immersive">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="hero-copy hero-copy--stacked">
          <span className="badge badge--hero">
            Wedding, reception, and Melsi decor with a stronger visual point of view
          </span>

          <h1>Elegant rooms. Clear process. No clutter.</h1>

          <p>
            Elel Events creates decoration setups that feel finished, balanced,
            and intentional. We design around the room, the event flow, and the
            feeling you want guests to walk into.
          </p>

          <div className="btn-row">
            <Link href="/request" className="btn">
              Request a Quote
            </Link>
            <Link href="/gallery" className="btn secondary">
              View Gallery
            </Link>
          </div>

          <div className="hero-signature-strip">
            <div>
              <span>Best Fit</span>
              <strong>Clients who want a polished room, not a random pile of decor pieces.</strong>
            </div>
            <div>
              <span>How We Work</span>
              <strong>Consult first, quote second, contract after details are clear.</strong>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-monogram">EE</div>
          <div className="hero-orbit hero-orbit--one" />
          <div className="hero-orbit hero-orbit--two" />

          <div className="hero-panel hero-panel--primary">
            <img src={heroPrimary} alt="Elel Events featured decor" />
            <div className="hero-panel-caption">
              <span>Reception styling</span>
              <strong>Head table, guest tables, and a room that feels composed.</strong>
            </div>
          </div>

          <div className="hero-panel hero-panel--secondary">
            <img src={heroSecondary} alt="Elel Events decor detail" />
          </div>

          <div className="hero-note">
            <p className="eyebrow">What Matters</p>
            <strong>Atmosphere first. Details second. Everything working together.</strong>
          </div>

          <div className="hero-callout">
            <span>Traditional events too</span>
            <strong>Melsi setups that feel elevated without becoming visually heavy.</strong>
          </div>

          <div className="hero-panel hero-panel--accent">
            <img src={heroAccent} alt="Elel Events styled venue" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="editorial-banner editorial-banner--lookbook">
          <div>
            <p className="eyebrow">Brand direction</p>
            <h2>Part mood board. Part concierge. Part booking system.</h2>
          </div>
          <div className="editorial-banner-copy">
            <p>
              The website should feel like inspiration first, then move cleanly
              into booking. That means fewer brochure blocks and more curated
              scenes, stronger imagery, and one confident path into the quote flow.
            </p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="brand-mosaic">
          <div className="brand-mosaic-copy card">
            <p className="eyebrow">What clients should feel</p>
            <h2>They should imagine the room before they even call.</h2>
            <p className="lead">
              The visual tone needs to do some of the selling for you. Not by
              shouting, but by making the work feel elevated, curated, and worth
              inquiring about.
            </p>
          </div>

          <div className="brand-mosaic-grid">
            {promisePoints.map((item, index) => (
              <div key={item.title} className={`service-ribbon-card brand-mosaic-card brand-mosaic-card--${index + 1}`}>
                <h3>{item.title}</h3>
                <p className="muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="process-shell card process-shell--luxury">
          <div className="process-copy">
            <span className="eyebrow">Booking journey</span>
            <h2>A booking system that still feels personal.</h2>
            <p className="lead">
              Clients come for the style. They stay because the process feels
              guided, premium, and easy to understand.
            </p>
          </div>

          <div className="process-steps">
            <div className="process-step">
              <span>01</span>
              <div>
                <h3>Send the request</h3>
                <p className="muted">
                  The client shares event type, venue, guest count, and decor needs.
                </p>
              </div>
            </div>

            <div className="process-step">
              <span>02</span>
              <div>
                <h3>Review and consult</h3>
                <p className="muted">
                  You confirm the room, the decor scope, and the right direction for the event.
                </p>
              </div>
            </div>

            <div className="process-step">
              <span>03</span>
              <div>
                <h3>Quote and confirm</h3>
                <p className="muted">
                  The client gets the quote, then the contract, then the event gets locked in properly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section section--gallery-highlight">
        <div className="lookbook-strip">
          <div className="lookbook-copy card">
            <span className="eyebrow">Lookbook energy</span>
            <h2>More like a saved board of dream rooms. Less like a local directory listing.</h2>
            <p className="lead">
              Couples and families should be able to picture their own event in
              the work, then move into the quote flow without friction.
            </p>
          </div>

          <div className="lookbook-actions card">
            <div>
              <strong>Browse rooms, focal points, and styling moments.</strong>
              <p className="muted">Then decide whether you want a full-room concept or selected details only.</p>
            </div>
            <div className="btn-row">
              <Link href="/gallery" className="btn secondary">
                Open Gallery
              </Link>
              <Link href="/packages" className="btn secondary">
                See Packages
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid-3 package-teaser-grid">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`package-card package-card--teaser ${index === 1 ? "featured" : ""}`}
            >
              <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
              <h3>{pkg.name}</h3>
              <p className="muted">
                {pkg.summary ??
                  pkg.best_for ??
                  "Custom decor support tailored to your event."}
              </p>
              <span className="package-card-link">Explore package</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="card cta-shell">
          <div>
            <span className="eyebrow">Ready to Begin</span>
            <h2>Tell us about the event and we’ll take it from there.</h2>
            <p className="lead">
              Start with the request form. We’ll review the event and guide the
              next steps personally.
            </p>
          </div>

          <div className="btn-row">
            <Link href="/request" className="btn">
              Start Your Quote
            </Link>
            <Link href="/packages" className="btn secondary">
              See Packages
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
