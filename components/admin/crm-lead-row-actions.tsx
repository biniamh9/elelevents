"use client";

import AdminPortalActionMenu from "@/components/admin/admin-portal-action-menu";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import { getCrmLeadWorkflowActionGroups } from "@/lib/admin-workflow-lane";
import { buildUnmatchedReplyReviewHref } from "@/lib/admin-navigation";
import type { CrmLead } from "@/lib/crm-analytics";

export default function CrmLeadRowActions({
  lead,
  unmatchedReplyCandidateCount = 0,
  unmatchedReplyReviewHref,
}: {
  lead: CrmLead;
  unmatchedReplyCandidateCount?: number;
  unmatchedReplyReviewHref?: string;
}) {
  const unmatchedReplyReviewTarget =
    unmatchedReplyReviewHref ??
    buildUnmatchedReplyReviewHref({ status: "pending_review" });

  return (
    <AdminPortalActionMenu>
      {(closeMenu) => (
        <>
          {getCrmLeadWorkflowActionGroups(lead).map((group) => (
            <div key={`${lead.id}-${group.title}`} className="admin-row-action-group">
              <p className="admin-row-action-group-label">{group.title}</p>
              {group.actions.map((action) => (
                <AdminWorkflowAction
                  key={`${lead.id}-${group.title}-${action.label}`}
                  href={action.href}
                  className="admin-workflow-action--menu"
                  tone={group.title === "Current step" ? "internal" : "record"}
                  label={action.label}
                  onClick={closeMenu}
                  description={
                    group.title === "Current step"
                      ? "Open the next working step for this lead."
                      : group.title === "Lead record"
                        ? "Open the lead record or add internal context."
                        : "Open the next related workflow area for this lead."
                  }
                />
              ))}
            </div>
          ))}
          {unmatchedReplyCandidateCount > 0 ? (
            <div className="admin-row-action-group">
              <p className="admin-row-action-group-label">Reply review</p>
              <AdminWorkflowAction
                href={unmatchedReplyReviewTarget}
                className="admin-workflow-action--menu"
                tone="email"
                onClick={closeMenu}
                label={
                  unmatchedReplyCandidateCount === 1
                    ? "Review unmatched reply candidate"
                    : `Review ${unmatchedReplyCandidateCount} unmatched reply candidates`
                }
                description="Open the safe review queue and attach the inbound reply only if this is the correct opportunity."
              />
            </div>
          ) : null}
        </>
      )}
    </AdminPortalActionMenu>
  );
}
