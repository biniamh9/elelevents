import type { DashboardAlert } from "@/lib/crm-analytics";

export default function CrmAlertsPanel({ items }: { items: DashboardAlert[] }) {
  return (
    <section className="card admin-section-card admin-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Needs Attention</p>
          <h3>Operational alerts</h3>
        </div>
      </div>
      <div className="crm-alert-list">
        {items.map((item) => (
          <div key={item.id} className={`crm-alert-item crm-alert-item--${item.severity}`}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
            <small>{item.count}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
