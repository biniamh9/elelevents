import Link from "next/link";
import { CRM_STAGE_LABELS, type CrmLead, type CrmStage } from "@/lib/crm-analytics";

const stageOrder: CrmStage[] = [
  "new_inquiry",
  "contacted",
  "consultation_scheduled",
  "consultation_completed",
  "quote_sent",
  "awaiting_deposit",
  "booked",
  "lost",
];

export default function CrmPipelineBoard({ leads }: { leads: CrmLead[] }) {
  return (
    <section className="card admin-section-card admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Pipeline funnel</p>
          <h3>Stage distribution</h3>
        </div>
      </div>
      <div className="crm-pipeline-board">
        {stageOrder.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage);

          return (
            <div key={stage} className="crm-pipeline-column">
              <div className="crm-pipeline-column-head">
                <strong>{CRM_STAGE_LABELS[stage]}</strong>
                <span>{stageLeads.length}</span>
              </div>
              <div className="crm-pipeline-column-list">
                {stageLeads.length ? (
                  stageLeads.map((lead) => (
                    <Link key={lead.id} href={`/admin/crm-analytics/${lead.id}`} className="crm-pipeline-card">
                      <strong>{lead.clientName}</strong>
                      <span>{lead.eventType}</span>
                      <small>${lead.estimatedValue.toLocaleString()}</small>
                    </Link>
                  ))
                ) : (
                  <div className="crm-pipeline-empty">No leads</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
