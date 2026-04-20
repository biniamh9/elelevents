type CustomerTimelineEntry = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  tone?: "default" | "success" | "warning" | "muted";
};

function formatTimelineDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerTimeline({
  eyebrow = "Client timeline",
  title = "Relationship activity",
  description,
  items,
  emptyMessage = "No timeline entries yet.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: CustomerTimelineEntry[];
  emptyMessage?: string;
}) {
  return (
    <section className="card admin-section-card admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>
      <div className="admin-activity-list admin-activity-list--timeline">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className={`admin-activity-item admin-activity-item--${item.tone ?? "default"}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
              <span>{formatTimelineDate(item.createdAt)}</span>
            </div>
          ))
        ) : (
          <p className="muted">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
