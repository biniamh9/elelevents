export default function CrmForecastCard({
  confirmed,
  likely,
  pipeline,
  forecast,
}: {
  confirmed: string;
  likely: string;
  pipeline: string;
  forecast: string;
}) {
  return (
    <section className="card admin-section-card admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Sales Forecast</p>
          <h3>Weighted revenue outlook</h3>
        </div>
      </div>
      <div className="crm-forecast-shell">
        <div className="crm-forecast-bars" aria-hidden="true">
          <div className="crm-forecast-bar crm-forecast-bar--confirmed" style={{ width: "24%" }} />
          <div className="crm-forecast-bar crm-forecast-bar--likely" style={{ width: "28%" }} />
          <div className="crm-forecast-bar crm-forecast-bar--pipeline" style={{ width: "48%" }} />
        </div>
        <div className="crm-forecast-grid">
          <div>
            <span>Confirmed revenue</span>
            <strong>{confirmed}</strong>
          </div>
          <div>
            <span>Likely revenue</span>
            <strong>{likely}</strong>
          </div>
          <div>
            <span>Pipeline revenue</span>
            <strong>{pipeline}</strong>
          </div>
          <div>
            <span>Total forecasted revenue</span>
            <strong>{forecast}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
