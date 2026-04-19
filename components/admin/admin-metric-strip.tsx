type MetricItem = {
  label: string;
  value: string | number;
  note?: string;
  tone?: "neutral" | "amber" | "blue" | "violet" | "green" | "red";
};

export default function AdminMetricStrip({
  items,
}: {
  items: MetricItem[];
}) {
  return (
    <section className="admin-mini-report admin-mini-report--compact">
      <div className="admin-kpi-grid admin-kpi-grid--compact">
        {items.map((item) => (
          <div
            key={item.label}
            className={`card metric-card${item.tone ? ` metric-card--${item.tone}` : ""}`}
          >
            <p className="muted">{item.label}</p>
            <strong>{item.value}</strong>
            {item.note ? <span>{item.note}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
