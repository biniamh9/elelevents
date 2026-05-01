type KPI = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "amber" | "blue" | "violet" | "green" | "red";
};

export default function CrmKpiGrid({ items }: { items: KPI[] }) {
  return (
    <section className="admin-reference-kpi-strip crm-kpi-shell">
      <div className="admin-kpi-grid admin-reference-kpi-grid crm-kpi-grid">
        {items.map((item) => (
          <div key={item.label} className={`admin-reference-kpi-card metric-card metric-card--${item.tone ?? "neutral"}`}>
            <p className="admin-reference-kpi-label">{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
