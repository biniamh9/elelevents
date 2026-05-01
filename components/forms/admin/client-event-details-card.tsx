"use client";

export default function ClientEventDetailsCard({
  values,
  onChange,
}: {
  values: {
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    event_type: string | null;
    event_date: string | null;
    guest_count: number | null;
    venue_name: string | null;
    venue_address: string | null;
  };
  onChange: (
    key: keyof typeof values,
    value: string | number | null
  ) => void;
}) {
  return (
    <section className="card admin-document-section admin-reference-records-shell">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Client & Event Details</p>
          <h3>Relationship context</h3>
        </div>
      </div>

      <div className="admin-document-grid">
        <div className="field">
          <label className="label">Client Name</label>
          <input
            className="input"
            value={values.customer_name}
            onChange={(event) => onChange("customer_name", event.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Client Email</label>
          <input
            className="input"
            value={values.customer_email ?? ""}
            onChange={(event) => onChange("customer_email", event.target.value || null)}
          />
        </div>
        <div className="field">
          <label className="label">Client Phone</label>
          <input
            className="input"
            value={values.customer_phone ?? ""}
            onChange={(event) => onChange("customer_phone", event.target.value || null)}
          />
        </div>
        <div className="field">
          <label className="label">Event Type</label>
          <input
            className="input"
            value={values.event_type ?? ""}
            onChange={(event) => onChange("event_type", event.target.value || null)}
          />
        </div>
        <div className="field">
          <label className="label">Event Date</label>
          <input
            className="input"
            type="date"
            value={values.event_date ?? ""}
            onChange={(event) => onChange("event_date", event.target.value || null)}
          />
        </div>
        <div className="field">
          <label className="label">Guest Count</label>
          <input
            className="input"
            type="number"
            min="0"
            value={values.guest_count ?? ""}
            onChange={(event) =>
              onChange(
                "guest_count",
                event.target.value === "" ? null : Number(event.target.value)
              )
            }
          />
        </div>
        <div className="field">
          <label className="label">Venue Name</label>
          <input
            className="input"
            value={values.venue_name ?? ""}
            onChange={(event) => onChange("venue_name", event.target.value || null)}
          />
        </div>
        <div className="field field--full">
          <label className="label">Venue Address</label>
          <input
            className="input"
            value={values.venue_address ?? ""}
            onChange={(event) => onChange("venue_address", event.target.value || null)}
          />
        </div>
      </div>
    </section>
  );
}
