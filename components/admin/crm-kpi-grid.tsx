type KPI = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "amber" | "blue" | "violet" | "green" | "red";
};

export default function CrmKpiGrid({ items }: { items: KPI[] }) {
  return (
    <section className="admin-mini-report admin-mini-report--compact crm-kpi-shell">
      <div className="admin-kpi-grid crm-kpi-grid">
        {items.map((item) => (
          <div key={item.label} className={`card metric-card metric-card--${item.tone ?? "neutral"}`}>
            <p className="muted">{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
