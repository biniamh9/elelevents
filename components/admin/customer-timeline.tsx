import AdminWorkflowAction from "@/components/admin/admin-workflow-action";

type CustomerTimelineEntry = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  tone?: "default" | "success" | "warning" | "muted";
  actionTone: "internal" | "email" | "sync" | "record";
  href: string;
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
            <AdminWorkflowAction
              key={item.id}
              href={item.href}
              className={`admin-workflow-action--menu admin-timeline-action admin-timeline-action--${item.tone ?? "default"}`}
              tone={item.actionTone}
              label={item.title}
              description={`${item.summary} · ${formatTimelineDate(item.createdAt)}`}
            />
          ))
        ) : (
          <p className="muted">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
