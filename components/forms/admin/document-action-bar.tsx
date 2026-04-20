"use client";

export default function DocumentActionBar({
  onSaveDraft,
  onPublish,
  onConvert,
  onRecordPayment,
  saveLabel = "Save Draft",
  publishLabel = "Mark Ready to Share",
  convertLabel,
  paymentLabel,
  busy = false,
  message,
}: {
  onSaveDraft: () => void;
  onPublish?: () => void;
  onConvert?: () => void;
  onRecordPayment?: () => void;
  saveLabel?: string;
  publishLabel?: string;
  convertLabel?: string;
  paymentLabel?: string;
  busy?: boolean;
  message?: string;
}) {
  return (
    <div className="document-action-bar">
      <div className="document-action-group">
        <button type="button" className="btn secondary" onClick={onSaveDraft} disabled={busy}>
          {busy ? "Saving..." : saveLabel}
        </button>
        {onPublish ? (
          <button type="button" className="btn" onClick={onPublish} disabled={busy}>
            {publishLabel}
          </button>
        ) : null}
        {onConvert && convertLabel ? (
          <button type="button" className="btn tertiary" onClick={onConvert} disabled={busy}>
            {convertLabel}
          </button>
        ) : null}
        {onRecordPayment && paymentLabel ? (
          <button type="button" className="btn tertiary" onClick={onRecordPayment} disabled={busy}>
            {paymentLabel}
          </button>
        ) : null}
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
