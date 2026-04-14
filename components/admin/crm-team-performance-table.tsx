import type { TeamPerformanceMetric } from "@/lib/crm-analytics";

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function CrmTeamPerformanceTable({ items }: { items: TeamPerformanceMetric[] }) {
  return (
    <section className="card admin-section-card admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Team performance</p>
          <h3>Owner contribution</h3>
        </div>
      </div>
      <div className="admin-record-table-shell">
        <table className="admin-records-table crm-records-table crm-records-table--compact">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Leads Assigned</th>
              <th>Quotes Sent</th>
              <th>Bookings</th>
              <th>Revenue Closed</th>
              <th>Avg Response</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name}>
                <td><strong>{item.name}</strong></td>
                <td>{item.leadsAssigned}</td>
                <td>{item.quotesSent}</td>
                <td>{item.bookings}</td>
                <td>{formatMoney(item.revenueClosed)}</td>
                <td>{item.averageResponseHours.toFixed(1)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
