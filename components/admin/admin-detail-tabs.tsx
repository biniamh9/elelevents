type AdminDetailTab = {
  href: string;
  label: string;
  count?: number | string | null;
};

export default function AdminDetailTabs({ tabs }: { tabs: AdminDetailTab[] }) {
  return (
    <nav className="admin-detail-tabs" aria-label="Detail page sections">
      {tabs.map((tab) => (
        <a key={tab.href} href={tab.href} className="admin-detail-tab">
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count !== null ? (
            <strong>{tab.count}</strong>
          ) : null}
        </a>
      ))}
    </nav>
  );
}
