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
    <section className="admin-mini-report admin-mini-report--compact admin-reference-kpi-strip">
      <div className="admin-kpi-grid admin-kpi-grid--compact admin-reference-kpi-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`card metric-card admin-reference-kpi-card${
              item.tone ? ` metric-card--${item.tone}` : ""
            }`}
          >
            <p className="muted admin-reference-kpi-label">{item.label}</p>
            <strong>{item.value}</strong>
            {item.note ? <span>{item.note}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
