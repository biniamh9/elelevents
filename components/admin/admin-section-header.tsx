import type { ReactNode } from "react";

export default function AdminSectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-panel-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h3>{title}</h3>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="admin-panel-actions">{actions}</div> : null}
    </div>
  );
}
