import type { ButtonHTMLAttributes } from "react";

type WorkflowActionTone = "internal" | "email" | "sync" | "record";

const toneLabels: Record<WorkflowActionTone, string> = {
  internal: "Internal",
  email: "Email",
  sync: "Sync",
  record: "Creates Record",
};

export default function AdminWorkflowAction({
  label,
  description,
  tone,
  className = "",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  description: string;
  tone: WorkflowActionTone;
}) {
  return (
    <button
      type="button"
      className={`admin-workflow-action admin-workflow-action--${tone} ${className}`.trim()}
      {...buttonProps}
    >
      <span className="admin-workflow-action-tone">{toneLabels[tone]}</span>
      <strong>{label}</strong>
      <span className="admin-workflow-action-description">{description}</span>
    </button>
  );
}
