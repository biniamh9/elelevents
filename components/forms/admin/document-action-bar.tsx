"use client";

export default function DocumentActionBar({
  onSaveDraft,
  onSend,
  onConvert,
  onRecordPayment,
  saveLabel = "Save Draft",
  sendLabel = "Send Document",
  convertLabel,
  paymentLabel,
  busy = false,
  message,
}: {
  onSaveDraft: () => void;
  onSend?: () => void;
  onConvert?: () => void;
  onRecordPayment?: () => void;
  saveLabel?: string;
  sendLabel?: string;
  convertLabel?: string;
  paymentLabel?: string;
  busy?: boolean;
  message?: string;
}) {
  return (
    <div className="document-action-bar">
      <div className="document-action-group">
        <button type="button" className="btn" onClick={onSaveDraft} disabled={busy}>
          {busy ? "Saving..." : saveLabel}
        </button>
        {onSend ? (
          <button type="button" className="btn secondary" onClick={onSend} disabled={busy}>
            {sendLabel}
          </button>
        ) : null}
        {onConvert && convertLabel ? (
          <button type="button" className="btn secondary" onClick={onConvert} disabled={busy}>
            {convertLabel}
          </button>
        ) : null}
        {onRecordPayment && paymentLabel ? (
          <button type="button" className="btn secondary" onClick={onRecordPayment} disabled={busy}>
            {paymentLabel}
          </button>
        ) : null}
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
