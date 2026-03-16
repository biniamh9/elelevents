import Link from "next/link";
import HeroBackdropRotator from "@/components/home/hero-backdrop-rotator";
import { getGalleryItems } from "@/lib/gallery";
import { getPackages } from "@/lib/packages";

const planningPaths = [
  {
    title: "Wedding reception",
    text: "Head table, backdrop, guest tables, and a full-room atmosphere.",
  },
  {
    title: "Traditional Melsi",
    text: "Traditional setup, next-day styling, and details that need care.",
  },
  {
    title: "Full decoration",
    text: "For clients who want one complete decor direction instead of item-by-item planning.",
  },
  {
    title: "Vendor help too",
    text: "Need catering, photography, venue, sound, or planning referrals as well.",
  },
];

const trustPoints = [
  "5-star Google review reputation",
  "Reception and Melsi experience",
  "Consultation before quote",
  "Quote, contract, and follow-up handled cleanly",
];

const processSteps = [
  {
    title: "Tell us the event",
    text: "Share the date, venue status, guest count, decor direction, and the must-have focal points.",
  },
  {
    title: "Upload the vision",
    text: "Add inspiration images or a vision board so we understand the look without endless back and forth.",
  },
  {
    title: "Refine and secure",
    text: "We consult, quote, send the contract, and confirm the event without making the process feel messy.",
  },
];

export default async function HomePage() {
  const galleryPreview = await getGalleryItems(6);
  const packages = await getPackages(3);
  const heroBackdropImages = galleryPreview.map((item) => item.image_url);
  const leadImage = galleryPreview[0]?.image_url;

  return (
    <main className="home-shell home-shell--simple">
      <div className="home-veil" />

      <section className="hero-stage hero-stage--simple">
        <HeroBackdropRotator images={heroBackdropImages} />

        <div className="container hero-stage-grid hero-stage-grid--simple">
          <div className="hero-stage-copy">
            <p className="eyebrow">Elel Events & Design</p>
            <div className="hero-stage-kicker">
              <span>Luxury decor studio</span>
              <span>Reception, wedding, and Melsi</span>
            </div>
            <h1>
              Simple to book.
              <br />
              <em>Beautiful to walk into.</em>
            </h1>
            <p className="hero-stage-lead">
              Luxury decor for receptions, Melsi, and milestone events with a
              cleaner process from inquiry to quote to contract.
            </p>

            <div className="btn-row">
              <Link href="/request" className="btn">
                Start Your Quote
              </Link>
              <Link href="/gallery" className="btn secondary">
                Browse the Work
              </Link>
            </div>

            <div className="hero-quick-search card">
              <p className="eyebrow">What are you planning?</p>
              <div className="hero-quick-grid">
                {planningPaths.map((item) => (
                  <Link key={item.title} href="/request" className="hero-quick-card">
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-stage-visual hero-stage-visual--simple">
            <div className="hero-stage-card hero-stage-card--tall">
              <img src={leadImage} alt="Luxury event setup by Elel Events" />
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="luxury-marquee" aria-label="Trust highlights">
          {trustPoints.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="simple-process-shell card">
          <div className="simple-process-head">
            <p className="eyebrow">How it works</p>
            <h2>Fast enough to choose. Clear enough to trust.</h2>
          </div>
          <div className="simple-process-grid">
            {processSteps.map((item, index) => (
              <div key={item.title} className="simple-process-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p className="muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="simple-package-shell">
          <div className="simple-package-head">
            <p className="eyebrow">Packages</p>
            <h2>Start with a direction, then tailor the room from there.</h2>
          </div>
          <div className="simple-package-grid">
            {packages.map((pkg) => (
              <div key={pkg.id} className="package-card package-card--simple">
                <p className="eyebrow">{pkg.best_for ?? "Decor package"}</p>
                <h3>{pkg.name}</h3>
                <p className="muted">
                  {pkg.summary ??
                    pkg.best_for ??
                    "Custom decor support tailored to your event."}
                </p>
                <Link href="/packages" className="package-card-link">
                  See package details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="simple-proof-band">
          <div className="card simple-proof-card">
            <p className="eyebrow">Gallery</p>
            <h3>See the room before you book it.</h3>
            <Link href="/gallery" className="link-inline">
              Browse the work
            </Link>
          </div>

          <div className="card simple-proof-card">
            <p className="eyebrow">Vendor support</p>
            <h3>Need vendor help beyond decor?</h3>
            <Link href="/vendors" className="link-inline">
              Explore vendor partners
            </Link>
          </div>

          <div className="card simple-proof-card">
            <p className="eyebrow">Start here</p>
            <h3>Upload the vision and we’ll shape the right next step.</h3>
            <Link href="/request" className="link-inline">
              Request your quote
            </Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="card cta-shell cta-shell--editorial">
          <div>
            <span className="eyebrow">Ready to begin</span>
            <h2>Tell us the event and we’ll take it from there.</h2>
            <p className="lead">
              The homepage should not make people work hard. The real detail belongs
              inside the request form, not in a crowded landing page.
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
