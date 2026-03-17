import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="container section public-page-shell">
      <section className="public-page-banner">
        <div className="public-page-banner-copy page-hero-copy">
          <p className="eyebrow">Contact</p>
          <h1>Start the conversation, then we’ll guide the next step clearly.</h1>
          <p className="lead">
            The fastest way to reach Elel Events is through the inquiry and consultation
            flow. That keeps the event details, vision, and follow-up in one place.
          </p>
          <div className="btn-row">
            <Link href="/request" className="btn">
              Book Consultation
            </Link>
            <Link href="/gallery" className="btn secondary">
              View Portfolio
            </Link>
          </div>
        </div>

        <div className="public-page-banner-side booking-intro-notes card">
          <div className="booking-note">
            <span>01</span>
            <div>
              <strong>Best first step</strong>
              <p className="muted">Use the inquiry form to share your event date, venue status, and decor direction.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>02</span>
            <div>
              <strong>Consultation before quote</strong>
              <p className="muted">Quotes are shaped after the real conversation, not from a generic instant calculator.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>03</span>
            <div>
              <strong>Visual references welcome</strong>
              <p className="muted">You can share inspiration images and mood direction during the booking flow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-2 public-note-grid">
        <div className="card">
          <h3>For design inquiries</h3>
          <p className="muted">
            Reception styling, Melsi setup, full decoration, and room transformation
            requests should all start through the consultation form.
          </p>
        </div>

        <div className="card">
          <h3>Need to see the work first?</h3>
          <p className="muted">
            Browse the portfolio to save the rooms, tables, and focal details that
            feel closest to your event vision.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link href="/gallery" className="link-inline">
              Open portfolio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
