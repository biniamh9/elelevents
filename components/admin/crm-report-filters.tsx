export default function CrmReportFilters({
  filters,
}: {
  filters: {
    q?: string;
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    dateRange?: string;
  };
}) {
  return (
    <form className="admin-record-filters crm-filter-grid" action="/admin/crm-analytics">
      <input type="hidden" name="tab" value="reports" />
      <label>
        <span>Search</span>
        <input name="q" defaultValue={filters.q ?? ""} placeholder="Client, venue, email" />
      </label>
      <label>
        <span>Stage</span>
        <input name="stage" defaultValue={filters.stage ?? ""} placeholder="Stage" />
      </label>
      <label>
        <span>Event type</span>
        <input name="eventType" defaultValue={filters.eventType ?? ""} placeholder="Event type" />
      </label>
      <label>
        <span>Source</span>
        <input name="source" defaultValue={filters.source ?? ""} placeholder="Source" />
      </label>
      <label>
        <span>Owner</span>
        <input name="owner" defaultValue={filters.owner ?? ""} placeholder="Owner" />
      </label>
      <label>
        <span>Date range</span>
        <select name="dateRange" defaultValue={filters.dateRange ?? ""}>
          <option value="">All dates</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
          <option value="90">Next 90 days</option>
        </select>
      </label>
      <button type="submit" className="btn">Apply</button>
    </form>
  );
}
