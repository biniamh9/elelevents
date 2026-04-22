import type { ReactNode } from "react";

export default function AdminEmptyState({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card admin-package-empty admin-empty-state">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action ? <div className="btn-row">{action}</div> : null}
    </div>
  );
}
