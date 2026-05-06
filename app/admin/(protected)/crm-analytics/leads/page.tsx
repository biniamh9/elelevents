import Link from "next/link";
import CrmInteractionsFeed from "@/components/admin/crm-interactions-feed";
import CrmLeadsTable from "@/components/admin/crm-leads-table";
import { requireAdminPage } from "@/lib/auth/admin";
import { buildCrmLeadsHref, buildCrmWorkspaceHref } from "@/lib/admin-navigation";
import { getStrongUnmatchedReplyCandidatesByInquiry } from "@/lib/unmatched-inbound-replies";
import {
  filterCrmLeads,
  sortCrmLeadsByActionReadiness,
} from "@/lib/crm-analytics";
import { getLiveCrmMetrics } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminCrmLeadsRoute({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    nextAction?: string;
    dateRange?: string;
    followUp?: string;
  }>;
}) {
  await requireAdminPage("crm");

  const params = await searchParams;
  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const unmatchedReplyCandidatesByInquiry =
    await getStrongUnmatchedReplyCandidatesByInquiry(
      crmMetrics.leads.map((lead) => ({
        id: lead.id,
        email: lead.email,
      }))
    );

  const baseFilteredLeads = filterCrmLeads(crmMetrics.leads, params);
  const filteredLeadIds = new Set(baseFilteredLeads.map((lead) => lead.id));
  const filteredInteractions = crmMetrics.interactions.filter((item) =>
    filteredLeadIds.has(item.leadId)
  );
  const revisionLeadIds = new Set(
    crmMetrics.tasks
      .filter((task) => task.title.toLowerCase().includes("revise quote"))
      .map((task) => task.leadId)
  );
  const unmatchedReplyCandidateCounts = Object.fromEntries(
    crmMetrics.leads.map((lead) => [
      lead.id,
      unmatchedReplyCandidatesByInquiry[lead.id]?.length ?? 0,
    ])
  );
  const filteredLeads = sortCrmLeadsByActionReadiness(baseFilteredLeads, {
    revisionLeadIds,
    unmatchedReplyCandidateCounts,
  });
  const unmatchedReplyReviewHrefs = Object.fromEntries(
    crmMetrics.leads.map((lead) => [
      lead.id,
      `/admin/inquiries/reply-review?reply=${unmatchedReplyCandidatesByInquiry[lead.id]?.[0]?.replyId ?? ""}`,
    ])
  );
  const crmLeadsState = {
    q: params.q,
    stage: params.stage,
    eventType: params.eventType,
    source: params.source,
    owner: params.owner,
    nextAction: params.nextAction,
    dateRange: params.dateRange,
    followUp: params.followUp,
  };
  const followUpFilterHref = buildCrmLeadsHref({
    state: crmLeadsState,
    nextFollowUp: "with_inspiration",
  });
  const clearFollowUpFilterHref = buildCrmLeadsHref({
    state: crmLeadsState,
    nextFollowUp: "",
  });
  const leadsById = new Map(crmMetrics.leads.map((lead) => [lead.id, lead]));

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>CRM Leads</h1>
          <p>Manage active inquiries and opportunities in one list-focused workspace without mixing execution with reporting.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-head-pill">Open pipeline</Link>
          <Link href={buildCrmWorkspaceHref("customers")} className="admin-head-pill">Open customers</Link>
          <Link href="/admin/inquiries/new" className="admin-head-pill">Add inquiry</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Leads stay focused on active opportunity handling: stage, ownership, next action, and quick access into the project and customer record.
        </p>
      </section>

      <CrmLeadsTable
        leads={filteredLeads}
        filters={crmLeadsState}
        revisionLeadIds={revisionLeadIds}
        followUpSummary={{
          pending: crmMetrics.followUpSummary.pending,
          reviewed: crmMetrics.followUpSummary.reviewed,
        }}
        followUpFilterHref={followUpFilterHref}
        clearFollowUpFilterHref={clearFollowUpFilterHref}
        unmatchedReplyCandidateCounts={unmatchedReplyCandidateCounts}
        unmatchedReplyReviewHrefs={unmatchedReplyReviewHrefs}
      />

      <CrmInteractionsFeed items={filteredInteractions.slice(0, 12)} leadsById={leadsById} />
    </main>
  );
}
