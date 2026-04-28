import Link from "next/link";

import AdminMetricStrip from "@/components/admin/admin-metric-strip";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import UnmatchedInboundReplyManagement from "@/components/forms/admin/unmatched-inbound-reply-management";
import {
  buildInquiryWorkspaceHref,
  buildUnmatchedReplyReviewHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import {
  getUnmatchedInboundReplyCounts,
  getUnmatchedInboundReplies,
  type UnmatchedInboundReplyReviewStatus,
} from "@/lib/unmatched-inbound-replies";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

type InquiryAttachCandidate = {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string | null;
  status: string | null;
};

function humanizeStatus(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AdminUnmatchedReplyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    reply?: string;
  }>;
}) {
  await requireAdminPage("overview");

  const { status = "pending_review", reply } = await searchParams;
  const activeStatus: UnmatchedInboundReplyReviewStatus = ["pending_review", "resolved", "ignored"].includes(status)
    ? (status as UnmatchedInboundReplyReviewStatus)
    : "pending_review";

  const [counts, replies] = await Promise.all([
    getUnmatchedInboundReplyCounts(),
    getUnmatchedInboundReplies({ reviewStatus: activeStatus, limit: 100 }),
  ]);

  const senderEmails = [...new Set(replies.map((item) => item.from_email).filter(Boolean))];
  const { data: inquiryRows, error: inquiryError } = senderEmails.length
    ? await supabaseAdmin
        .from("event_inquiries")
        .select("id, first_name, last_name, email, event_type, event_date, status, created_at")
        .in("email", senderEmails)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (inquiryError) {
    throw new Error(inquiryError.message);
  }

  const inquiryCandidatesByReply = replies.reduce<Record<string, InquiryAttachCandidate[]>>(
    (map, item) => {
      const candidates = (inquiryRows ?? [])
        .filter((candidate) => candidate.email?.trim().toLowerCase() === item.from_email)
        .map((candidate) => ({
          id: candidate.id,
          clientName: `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || "Unnamed client",
          eventType: candidate.event_type || "Event",
          eventDate: candidate.event_date,
          status: candidate.status,
        }));

      map[item.id] = candidates;
      return map;
    },
    {}
  );

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="Inbound Reply Review"
        description="Safely review customer replies that could not be matched to a single opportunity. Attach them manually or resolve them without contaminating the wrong timeline."
        aside={
          <Link
            href={buildInquiryWorkspaceHref({ tab: "inquiries", state: {} })}
            className="btn secondary"
          >
            Back to inquiries
          </Link>
        }
      />

      <AdminMetricStrip
        items={[
          {
            label: "Pending review",
            value: counts.pending_review,
            note: "Needs manual attachment or resolution",
            tone: "amber",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            note: "Handled safely by admin review",
            tone: "green",
          },
          {
            label: "Ignored",
            value: counts.ignored,
            note: "Explicitly dismissed from queue",
            tone: "neutral",
          },
        ]}
      />

      <div className="admin-workspace-tabs admin-workspace-tabs--inline">
        <Link
          href={buildUnmatchedReplyReviewHref({ status: "pending_review" })}
          className={`admin-workspace-tab${activeStatus === "pending_review" ? " is-active" : ""}`}
        >
          Pending review
        </Link>
        <Link
          href={buildUnmatchedReplyReviewHref({ status: "resolved" })}
          className={`admin-workspace-tab${activeStatus === "resolved" ? " is-active" : ""}`}
        >
          Resolved
        </Link>
        <Link
          href={buildUnmatchedReplyReviewHref({ status: "ignored" })}
          className={`admin-workspace-tab${activeStatus === "ignored" ? " is-active" : ""}`}
        >
          Ignored
        </Link>
      </div>

      {activeStatus !== "pending_review" ? (
        <section className="card admin-section-card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Review archive</p>
              <h3>{humanizeStatus(activeStatus)}</h3>
            </div>
          </div>
          <div className="admin-placeholder-list">
            {replies.length ? (
              replies.map((item) => (
                <div key={item.id}>
                  <strong>{item.subject?.trim() || "No subject"}</strong>
                  <span>{item.from_email} · {humanizeStatus(item.match_reason)}</span>
                </div>
              ))
            ) : (
              <div>
                <strong>No replies in this state</strong>
                <span>The archive is currently clear.</span>
              </div>
            )}
          </div>
        </section>
      ) : (
        <UnmatchedInboundReplyManagement
          replies={replies}
          inquiryCandidatesByReply={inquiryCandidatesByReply}
          selectedReplyId={reply ?? null}
        />
      )}
    </main>
  );
}
