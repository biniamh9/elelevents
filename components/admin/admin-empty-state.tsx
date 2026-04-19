export default function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card admin-package-empty admin-empty-state">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
