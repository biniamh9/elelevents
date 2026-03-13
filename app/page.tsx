import Link from "next/link";
import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";

const promisePoints = [
  {
    title: "Full-room styling",
    text: "Head table, backdrop, guest tables, entrance decor, and the visual rhythm of the whole space.",
  },
  {
    title: "Consultation-first quoting",
    text: "The quote follows the real conversation, not a fake calculator on the website.",
  },
  {
    title: "Clean process",
    text: "Inquiry, consultation, quote, contract, and payment tracking in one organized flow.",
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
        <div className="editorial-banner">
          <p className="eyebrow">Why It Works</p>
          <div className="editorial-banner-copy">
            <h2>One message. One focus. One clear next step.</h2>
            <p>
              Clients do not need ten sections fighting for attention. They need
              to understand your taste, trust your work, and know where to begin.
            </p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="service-ribbon">
          {promisePoints.map((item) => (
            <div key={item.title} className="service-ribbon-card">
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="process-shell card">
          <div className="process-copy">
            <span className="eyebrow">How It Works</span>
            <h2>Simple for the customer. Organized for you.</h2>
            <p className="lead">
              The website captures the request, you review the scope, agree on
              the quote after the consultation, and send the contract only when
              the details make sense.
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
        <div className="card cta-shell cta-shell--light">
          <div>
            <span className="eyebrow">What You Can Expect</span>
            <h2>A room that feels styled with intention, not crowded with random pieces.</h2>
            <p className="lead">
              We focus on the visual flow of the event: the entrance, the focal
              tables, the guest experience, and the way every element works
              together once the room is full.
            </p>
          </div>

          <div className="btn-row">
            <Link href="/gallery" className="btn secondary">
              View Gallery
            </Link>
            <Link href="/packages" className="btn secondary">
              Compare Packages
            </Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid-3">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`package-card ${index === 1 ? "featured" : ""}`}
            >
              <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
              <h3>{pkg.name}</h3>
              <p className="muted">
                {pkg.summary ??
                  pkg.best_for ??
                  "Custom decor support tailored to your event."}
              </p>
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
