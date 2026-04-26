import Link from "next/link";
import { buildCrmLeadDetailHref } from "@/lib/admin-navigation";
import type { CrmInteraction, CrmLead } from "@/lib/crm-analytics";

function formatRelative(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export default function CrmInteractionsFeed({
  items,
  leadsById,
}: {
  items: CrmInteraction[];
  leadsById: Map<string, CrmLead>;
}) {
  return (
    <section className="card admin-section-card admin-panel crm-interactions-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Recent interactions</p>
          <h3>Client-side activity</h3>
        </div>
      </div>
      <div className="admin-list crm-interactions-list">
        {items.map((item) => {
          const lead = leadsById.get(item.leadId);
          return (
            <Link key={item.id} href={buildCrmLeadDetailHref(item.leadId)} className="admin-list-item crm-interaction-item">
              <div>
                <strong>{item.title}</strong>
                <span>{lead ? `${lead.clientName} · ${item.summary}` : item.summary}</span>
              </div>
              <small>{formatRelative(item.createdAt)}</small>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
