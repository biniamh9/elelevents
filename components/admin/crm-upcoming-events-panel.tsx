import Link from "next/link";
import { buildCrmLeadDetailHref } from "@/lib/admin-navigation";
import type { CrmLead } from "@/lib/crm-analytics";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CrmUpcomingEventsPanel({ items }: { items: CrmLead[] }) {
  return (
    <section className="card admin-section-card admin-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Upcoming events</p>
          <h3>Booked delivery calendar</h3>
        </div>
      </div>
      <div className="crm-upcoming-list">
        {items.map((item) => (
          <Link key={item.id} href={buildCrmLeadDetailHref(item.id)} className="crm-upcoming-item">
            <div>
              <strong>{item.clientName}</strong>
              <span>{item.eventType} · {formatDate(item.eventDate)}</span>
            </div>
            <small>
              {item.paymentStatus?.replaceAll("_", " ")} · {item.decorStatus?.replaceAll("_", " ")}
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
