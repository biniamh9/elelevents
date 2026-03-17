import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="container section public-page-shell">
      <section className="booking-intro public-page-hero public-page-hero--ritual">
        <div className="booking-intro-copy page-hero-copy">
          <p className="eyebrow">About Elel Events</p>
          <h1>Designing rooms that feel warm, elevated, and memorable.</h1>
          <p className="lead">
            Elel Events & Design creates wedding and celebration spaces that feel
            polished without losing warmth. The process is consultation-led, visually
            driven, and built around the atmosphere each client wants guests to walk
            into.
          </p>
        </div>

        <div className="booking-intro-notes card">
          <div className="booking-note">
            <span>01</span>
            <div>
              <strong>Reception and Melsi experience</strong>
              <p className="muted">Traditional events and modern celebrations handled with the same care.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>02</span>
            <div>
              <strong>Design-first approach</strong>
              <p className="muted">Mood, focal points, and room flow come before generic package thinking.</p>
            </div>
          </div>
          <div className="booking-note">
            <span>03</span>
            <div>
              <strong>Clear client process</strong>
              <p className="muted">Inquiry, consultation, quote, contract, and follow-up handled in one clean flow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-2 public-note-grid">
        <div className="card">
          <h3>What clients can expect</h3>
          <p className="muted">
            A refined process, collaborative consultation, and styling that feels
            intentional from the entrance to the head table to the final room reveal.
          </p>
        </div>

        <div className="card">
          <h3>How to begin</h3>
          <p className="muted">
            Start with the inquiry form, upload the vision if you have one, then
            move into consultation before the quote and contract stage.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link href="/request" className="btn">
              Book Consultation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
