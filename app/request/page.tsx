import EventRequestForm from "@/components/forms/event-request-form";

export default function RequestPage() {
  return (
    <main className="container section">
      <h2>Start Your Decor Booking</h2>
      <p className="lead">
        This flow is designed to collect the details we actually need before a
        consultation. It is not a generic contact form and it does not book the
        event automatically. It helps us review your scope, confirm availability,
        and prepare for a real planning conversation.
      </p>

      <div className="grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <h3>How This Booking Flow Works</h3>
          <p className="muted">
            Good leads are built on specifics. The form now walks through the
            event, the decor scope, and the preferred consultation path.
          </p>
          <ul>
            <li>Share your event details and decor priorities</li>
            <li>Select the areas you want styled or rented</li>
            <li>Tell us how you want the consultation to happen</li>
            <li>We review the request before quoting or scheduling</li>
          </ul>
        </div>

        <div className="card">
          <h3>What Makes a Request Strong</h3>
          <p className="muted">
            The best inquiries make the consultation easier, the quote faster,
            and the contract cleaner.
          </p>
          <ul>
            <li>Event date, guest count, and venue status</li>
            <li>Specific decor zones like head table or buffet styling</li>
            <li>Theme direction, inspiration, and must-have details</li>
            <li>Setup, teardown, and rental support needs</li>
          </ul>
        </div>
      </div>

      <EventRequestForm />

      <div style={{ marginTop: "24px" }} className="grid-2">
        <div className="card">
          <h3>Estimate First, Consultation Second</h3>
          <p className="muted">
            The estimate shown in the form is only a starting point. Final
            pricing may vary depending on design complexity, rentals, venue
            restrictions, setup requirements, teardown logistics, and staffing
            needs.
          </p>
        </div>

        <div className="card">
          <h3>What Happens Next?</h3>
          <p className="muted">
            After you submit, we review the request internally, reach out for a
            consultation if needed, confirm scope, and then move to quote,
            contract, and booking steps.
          </p>
        </div>
      </div>
    </main>
  );
}
