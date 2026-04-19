import type { ReactNode } from "react";

export default function AdminActionRow({
  primary,
  secondary,
  destructive,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  destructive?: ReactNode;
}) {
  return (
    <div className="admin-package-actions admin-action-row">
      {secondary}
      {primary}
      {destructive}
    </div>
  );
}
