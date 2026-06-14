"use client";

export default function DocumentActionBar({
  onSaveDraft,
  onPublish,
  onPreview,
  onEmail,
  onConvert,
  onRecordPayment,
  saveLabel = "Save Draft",
  publishLabel = "Mark Ready to Share",
  previewLabel = "Save & Preview",
  emailLabel = "Email to Customer",
  convertLabel,
  paymentLabel,
  title = "Document actions",
  description = "Save your work, review the client-facing output, then continue the workflow.",
  busy = false,
  message,
}: {
  onSaveDraft: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
  onEmail?: () => void;
  onConvert?: () => void;
  onRecordPayment?: () => void;
  saveLabel?: string;
  publishLabel?: string;
  previewLabel?: string;
  emailLabel?: string;
  convertLabel?: string;
  paymentLabel?: string;
  title?: string;
  description?: string;
  busy?: boolean;
  message?: string;
}) {
  return (
    <section className="card document-action-bar">
      <div className="document-action-bar-copy">
        <p className="eyebrow">Next action</p>
        <h3>{title}</h3>
        <p className="muted">{description}</p>
      </div>
      <div className="document-action-group" aria-label={title}>
        <button
          type="button"
          className="btn secondary"
          onClick={onSaveDraft}
          disabled={busy}
        >
          {busy ? "Saving..." : saveLabel}
        </button>
        {onPreview ? (
          <button
            type="button"
            className="btn secondary"
            onClick={onPreview}
            disabled={busy}
          >
            {previewLabel}
          </button>
        ) : null}
        {onEmail ? (
          <button
            type="button"
            className="btn document-action-primary"
            onClick={onEmail}
            disabled={busy}
          >
            {emailLabel}
          </button>
        ) : null}
        {onPublish ? (
          <button
            type="button"
            className="btn secondary"
            onClick={onPublish}
            disabled={busy}
          >
            {publishLabel}
          </button>
        ) : null}
        {onConvert && convertLabel ? (
          <button
            type="button"
            className="btn secondary"
            onClick={onConvert}
            disabled={busy}
          >
            {convertLabel}
          </button>
        ) : null}
        {onRecordPayment && paymentLabel ? (
          <button
            type="button"
            className="btn document-action-primary"
            onClick={onRecordPayment}
            disabled={busy}
          >
            {paymentLabel}
          </button>
        ) : null}
      </div>
      {message ? <p className="document-action-message" role="status">{message}</p> : null}
    </section>
  );
}
