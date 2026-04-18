import { notFound } from "next/navigation";
import { verifyQuoteActionToken } from "@/lib/quote-client-actions";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

function formatDate(value: string | null) {
  if (!value) return "To be confirmed";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function QuoteRespondPage({
  searchParams,
}: {
  searchParams: Promise<{
    inquiry?: string;
    action?: string;
    token?: string;
    result?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const inquiryId = params.inquiry ?? "";
  const action = params.action === "request_changes" ? "request_changes" : "approve";
  const token = params.token ?? "";
  const result = params.result === "success" ? "success" : params.result === "error" ? "error" : null;
  const message = typeof params.message === "string" ? params.message : null;

  if (!inquiryId || !token) {
    notFound();
  }

  const { data: inquiry } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, email, event_type, event_date, venue_name, quote_response_status, quoted_at")
    .eq("id", inquiryId)
    .maybeSingle();

  if (!inquiry?.email || !inquiry.quoted_at) {
    notFound();
  }

  const valid = verifyQuoteActionToken(token, {
    inquiryId: inquiry.id,
    email: inquiry.email,
    quotedAt: inquiry.quoted_at,
  });

  if (!valid) {
    notFound();
  }

  const isApproved = inquiry.quote_response_status === "accepted";
  const isChangesRequested = inquiry.quote_response_status === "changes_requested";
  const alreadyHandled =
    (action === "approve" && isApproved) ||
    (action === "request_changes" && isChangesRequested);

  return (
    <main className="section">
      <div className="quote-response-page">
        <div className="quote-response-card">
          <p className="eyebrow">Elel Events &amp; Design</p>
          <h1>
            {action === "approve" ? "Approve your quote" : "Request quote changes"}
          </h1>
          <p className="lead">
            {inquiry.event_type} on {formatDate(inquiry.event_date)}
            {inquiry.venue_name ? ` • ${inquiry.venue_name}` : ""}
          </p>

          {isApproved ? (
            <div className="admin-alert-card admin-alert-card--success">
              <strong>This quote has already been approved.</strong>
              <p>Our team can now move forward with agreement and booking steps.</p>
            </div>
          ) : null}

          {isChangesRequested ? (
            <div className="admin-alert-card admin-alert-card--attention">
              <strong>Changes have already been requested.</strong>
              <p>Our team has been notified that you want revisions to the proposal.</p>
            </div>
          ) : null}

          {result === "success" && message ? (
            <div className="admin-alert-card admin-alert-card--success">
              <strong>Response received.</strong>
              <p>{message}</p>
            </div>
          ) : null}

          {result === "error" && message ? (
            <div className="admin-alert-card admin-alert-card--warning">
              <strong>We could not complete that action.</strong>
              <p>{message}</p>
            </div>
          ) : null}

          {alreadyHandled ? null : (
            <form className="quote-response-form" action="/api/quotes/respond" method="post">
              <input type="hidden" name="inquiryId" value={inquiry.id} />
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value={action} />

              <div className="field">
                <label className="label">
                  {action === "approve"
                    ? "Optional note"
                    : "What would you like changed?"}
                </label>
                <textarea
                  className="textarea"
                  name="comment"
                  placeholder={
                    action === "approve"
                      ? "Optional message for the Elel team"
                      : "Tell us what to remove, revise, or itemize further"
                  }
                  rows={6}
                />
              </div>

              <div className="quote-response-actions">
                <button type="submit" className="btn">
                  {action === "approve" ? "Approve Quote" : "Send Change Request"}
                </button>
                <a
                  className="btn secondary"
                  href={`/quote/respond?inquiry=${inquiry.id}&action=${
                    action === "approve" ? "request_changes" : "approve"
                  }&token=${encodeURIComponent(token)}`}
                >
                  {action === "approve" ? "Request Changes Instead" : "Approve Instead"}
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
