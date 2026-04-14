export default function CrmFunnelCard({
  items,
}: {
  items: Array<{ label: string; count: number; dropoff?: string }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="card admin-section-card admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Pipeline funnel</p>
          <h3>Stage drop-off visibility</h3>
        </div>
      </div>
      <div className="crm-funnel-list">
        {items.map((item) => (
          <div key={item.label} className="crm-funnel-row">
            <div className="crm-funnel-copy">
              <strong>{item.label}</strong>
              <span>{item.dropoff ?? "Holding stage movement"}</span>
            </div>
            <div className="crm-funnel-rail">
              <div className="crm-funnel-fill" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
            </div>
            <small>{item.count}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
