"use client";

import { useState } from "react";
import Link from "next/link";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { buildInquiryDetailHref } from "@/lib/admin-navigation";
import type { UnmatchedInboundReply } from "@/lib/unmatched-inbound-replies";

type InquiryAttachCandidate = {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string | null;
  status: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function humanizeLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function truncateText(value: string, max = 280) {
  const normalized = value.trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

export default function UnmatchedInboundReplyManagement({
  replies,
  inquiryCandidatesByReply,
  selectedReplyId,
}: {
  replies: UnmatchedInboundReply[];
  inquiryCandidatesByReply: Record<string, InquiryAttachCandidate[]>;
  selectedReplyId?: string | null;
}) {
  const [rows, setRows] = useState(replies);
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messageById, setMessageById] = useState<Record<string, string>>({});

  if (!rows.length) {
    return (
      <AdminEmptyState
        eyebrow="Inbound reply review"
        title="No unmatched replies pending"
        description="When a reply cannot be safely attached to an opportunity, it will land here for manual review instead of being matched by email guesswork."
      />
    );
  }

  async function submitAction(
    replyId: string,
    action: "attach" | "ignore" | "resolve"
  ) {
    const inquiryId = selectedInquiryIds[replyId];
    if (action === "attach" && !inquiryId) {
      setMessageById((current) => ({
        ...current,
        [replyId]: "Select an inquiry before attaching this reply.",
      }));
      return;
    }

    setBusyId(replyId);
    setMessageById((current) => ({ ...current, [replyId]: "" }));

    try {
      const response = await fetch(`/api/admin/unmatched-email-replies/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          inquiryId: action === "attach" ? inquiryId : undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update unmatched reply");
      }

      setRows((current) => current.filter((row) => row.id !== replyId));
      setMessageById((current) => ({
        ...current,
        [replyId]:
          action === "attach"
            ? "Reply attached to inquiry."
            : action === "ignore"
              ? "Reply ignored."
              : "Reply marked resolved.",
      }));
    } catch (error) {
      setMessageById((current) => ({
        ...current,
        [replyId]:
          error instanceof Error ? error.message : "Failed to update unmatched reply",
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card admin-table-card admin-records-table-card">
      <AdminSectionHeader
        eyebrow="Inbound reply review"
        title="Replies that need manual attachment"
        description="These emails were intentionally not auto-attached because the system could not prove the exact opportunity safely."
      />

      <div className="admin-stack">
        {rows.map((reply) => {
          const candidates = inquiryCandidatesByReply[reply.id] ?? [];
          const highlighted = selectedReplyId === reply.id;
          return (
            <section
              key={reply.id}
              className={`card admin-section-card admin-panel${highlighted ? " admin-panel--highlighted" : ""}`}
            >
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Reply received</p>
                  <h3>{reply.subject?.trim() || "No subject"}</h3>
                </div>
                <div className="summary-pills">
                  <span className="summary-chip">From: {reply.from_email}</span>
                  <span className="summary-chip">Reason: {humanizeLabel(reply.match_reason)}</span>
                  <span className="summary-chip">{formatDate(reply.created_at)}</span>
                </div>
              </div>

              <div className="booking-final-summary-grid">
                <div>
                  <small>Reply-to alias</small>
                  <span>{reply.to_email || "Not available"}</span>
                </div>
                <div>
                  <small>Conversation key</small>
                  <span>{reply.conversation_key || "Not present"}</span>
                </div>
                <div>
                  <small>Provider</small>
                  <span>{reply.provider || "Unknown"}</span>
                </div>
                <div>
                  <small>Thread / Message</small>
                  <span>{reply.thread_id || reply.message_id || "Not available"}</span>
                </div>
              </div>

              <div className="admin-placeholder-list">
                <div>
                  <strong>Reply preview</strong>
                  <span>{truncateText(reply.body_text)}</span>
                </div>
              </div>

              <div className="admin-field-grid">
                <div>
                  <label>Attach to inquiry</label>
                  <select
                    value={selectedInquiryIds[reply.id] ?? ""}
                    onChange={(event) =>
                      setSelectedInquiryIds((current) => ({
                        ...current,
                        [reply.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select inquiry</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.clientName} · {candidate.eventType} · {formatDate(candidate.eventDate)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {candidates.length ? (
                <div className="admin-placeholder-list">
                  {candidates.map((candidate) => (
                    <div key={candidate.id}>
                      <strong>
                        <Link href={buildInquiryDetailHref(candidate.id)}>
                          {candidate.clientName} · {candidate.eventType}
                        </Link>
                      </strong>
                      <span>{formatDate(candidate.eventDate)} · {humanizeLabel(candidate.status)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-placeholder-list">
                  <div>
                    <strong>No inquiry suggestions</strong>
                    <span>Create or identify the correct inquiry before attaching this reply.</span>
                  </div>
                </div>
              )}

              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={busyId === reply.id}
                  onClick={() => void submitAction(reply.id, "attach")}
                >
                  Attach to inquiry
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busyId === reply.id}
                  onClick={() => void submitAction(reply.id, "resolve")}
                >
                  Mark resolved
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busyId === reply.id}
                  onClick={() => void submitAction(reply.id, "ignore")}
                >
                  Ignore
                </button>
              </div>

              {messageById[reply.id] ? (
                <p className="muted">{messageById[reply.id]}</p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
