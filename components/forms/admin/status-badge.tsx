export default function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status-badge admin-status-badge--${status}`}>{status.replaceAll("_", " ")}</span>;
}
