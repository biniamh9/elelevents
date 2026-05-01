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
  showTone = true,
  showDescription = true,
  ...buttonProps
}: (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
) & {
  label: string;
  description: string;
  tone: WorkflowActionTone;
  href?: string;
  showTone?: boolean;
  showDescription?: boolean;
}) {
  const classes =
    `admin-workflow-action admin-workflow-action--${tone} ${className}`.trim();

  if (href) {
    const linkProps = buttonProps as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link href={href} className={classes} {...linkProps}>
        {showTone ? (
          <span className="admin-workflow-action-tone">{toneLabels[tone]}</span>
        ) : null}
        <strong>{label}</strong>
        {showDescription ? (
          <span className="admin-workflow-action-description">{description}</span>
        ) : null}
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
      {showTone ? (
        <span className="admin-workflow-action-tone">{toneLabels[tone]}</span>
      ) : null}
      <strong>{label}</strong>
      {showDescription ? (
        <span className="admin-workflow-action-description">{description}</span>
      ) : null}
    </button>
  );
}
