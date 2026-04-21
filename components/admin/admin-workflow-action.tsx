import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

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
  href,
  className = "",
  ...buttonProps
}: (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
) & {
  label: string;
  description: string;
  tone: WorkflowActionTone;
  href?: string;
}) {
  const classes =
    `admin-workflow-action admin-workflow-action--${tone} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        <span className="admin-workflow-action-tone">{toneLabels[tone]}</span>
        <strong>{label}</strong>
        <span className="admin-workflow-action-description">{description}</span>
      </Link>
    );
  }

  const actionButtonProps =
    buttonProps as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type="button"
      className={classes}
      {...actionButtonProps}
    >
      <span className="admin-workflow-action-tone">{toneLabels[tone]}</span>
      <strong>{label}</strong>
      <span className="admin-workflow-action-description">{description}</span>
    </button>
  );
}
