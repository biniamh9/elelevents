import type { ReactNode } from "react";

export default function AdminPageIntro({
  title,
  description,
  aside,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="admin-page-header admin-page-header--reference">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside ? <div className="admin-page-head-aside">{aside}</div> : null}
    </div>
  );
}
