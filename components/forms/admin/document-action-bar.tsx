"use client";

import AdminWorkflowAction from "@/components/admin/admin-workflow-action";

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
        <AdminWorkflowAction
          tone="internal"
          label={busy ? "Saving..." : saveLabel}
          description="Updates the internal document draft, totals, and preview only."
          onClick={onSaveDraft}
          disabled={busy}
        />
        {onPublish ? (
          <AdminWorkflowAction
            tone="internal"
            label={publishLabel}
            description="Marks the document ready for the related workflow to share with the client."
            onClick={onPublish}
            disabled={busy}
          />
        ) : null}
        {onConvert && convertLabel ? (
          <AdminWorkflowAction
            tone="record"
            label={convertLabel}
            description="Creates the next downstream document record from the current document."
            onClick={onConvert}
            disabled={busy}
          />
        ) : null}
        {onRecordPayment && paymentLabel ? (
          <AdminWorkflowAction
            tone="record"
            label={paymentLabel}
            description="Opens payment entry so the invoice can create a receipt and update balances."
            onClick={onRecordPayment}
            disabled={busy}
          />
        ) : null}
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
