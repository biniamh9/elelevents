import Link from "next/link";
import InquiryRecordActions from "@/components/forms/admin/inquiry-record-actions";
import StatusBadge from "@/components/forms/admin/status-badge";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function buildShare(count: number | null | undefined, total: number | null | undefined) {
  if (!count || !total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePage(pageValue?: string) {
  const page = Number(pageValue ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    event_type?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const eventType = params.event_type || "";
  const queryText = params.q?.trim() || "";
  const sort = params.sort || "newest";
  const page = normalizePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();

  let query = supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, created_at, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, estimated_price, consultation_status, quote_response_status",
      { count: "exact" }
    )
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (queryText) {
    const safeQuery = queryText.replace(/,/g, " ");
    query = query.or(
      `first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%,venue_name.ilike.%${safeQuery}%`
    );
  }

  if (sort === "event_date") {
    query = query.order("event_date", { ascending: true, nullsFirst: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count: filteredCount } = await query;

  const { count: totalCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true });

  const { count: pendingCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "contacted"]);

  const { count: quotedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const { count: bookedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked");

  const { data: pipelineRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price, status")
    .in("status", ["new", "contacted", "quoted", "booked"]);

  const pipelineValue =
    pipelineRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ?? 0;

  const { count: inquiriesThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const { count: bookedThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const conversionRate =
    inquiriesThisMonth && inquiriesThisMonth > 0
      ? ((bookedThisMonth ?? 0) / inquiriesThisMonth) * 100
      : 0;

  const { data: bookedRevenueRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price")
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const bookedRevenueThisMonth =
    bookedRevenueRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ??
    0;

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];
  const eventTypes = [
    "Wedding",
    "Traditional (Melsi)",
    "Birthday",
    "Baby Shower",
    "Bridal Shower",
    "Corporate Event",
    "Graduation",
    "Anniversary",
  ];

  const reportCards = [
    {
      label: "Total inquiries",
      value: String(totalCount ?? 0),
      note: "All inquiry records",
    },
    {
      label: "Pending requests",
      value: String(pendingCount ?? 0),
      note: `${buildShare(pendingCount, totalCount)}% of all inquiries`,
    },
    {
      label: "Booked events",
      value: String(bookedCount ?? 0),
      note: `${conversionRate.toFixed(1)}% booked this month`,
    },
    {
      label: "Revenue / quotes",
      value: `$${formatMoney(bookedRevenueThisMonth)}`,
      note: `Quoted: ${quotedCount ?? 0} • Pipeline: $${formatMoney(pipelineValue)}`,
    },
  ];

  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));
  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function buildPageHref(nextPageValue: number) {
    const nextParams = new URLSearchParams();
    if (status) nextParams.set("status", status);
    if (eventType) nextParams.set("event_type", eventType);
    if (queryText) nextParams.set("q", queryText);
    if (sort) nextParams.set("sort", sort);
    if (nextPageValue > 1) nextParams.set("page", String(nextPageValue));
    const queryString = nextParams.toString();
    return queryString ? `/admin/inquiries?${queryString}` : "/admin/inquiries";
  }

  return (
    <main className="section admin-page">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Records management</p>
          <h1>Inquiries</h1>
          <p className="lead">
            Search, filter, sort, and act on inquiry records from one table-based workspace.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Showing: {filteredCount ?? 0}</span>
          <span className="admin-head-pill">Pipeline: ${formatMoney(pipelineValue)}</span>
          <span className="admin-head-pill">{conversionRate.toFixed(1)}% conversion</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Top-line numbers only. The full list lives in the table below.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          {reportCards.map((card) => (
            <div key={card.label} className="card metric-card metric-card--neutral">
              <p className="muted">{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="card admin-table-card admin-records-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Inquiry Records</p>
            <h3>Manage the existing records</h3>
          </div>
        </div>

        <form method="GET" className="admin-filters admin-filters--records">
          <div className="field">
            <label className="label">Search</label>
            <input
              name="q"
              defaultValue={queryText}
              className="input"
              placeholder="Client, email, phone, or venue"
            />
          </div>

          <div className="field">
            <label className="label">Status</label>
            <select name="status" defaultValue={status} className="input">
              <option value="">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {humanizeLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Event Type</label>
            <select name="event_type" defaultValue={eventType} className="input">
              <option value="">All</option>
              {eventTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Sort By</label>
            <select name="sort" defaultValue={sort} className="input">
              <option value="newest">Created date: newest</option>
              <option value="oldest">Created date: oldest</option>
              <option value="event_date">Event date</option>
            </select>
          </div>

          <div className="admin-filter-actions">
            <button type="submit" className="btn">
              Apply
            </button>
            <Link href="/admin/inquiries" className="btn secondary">
              Reset
            </Link>
          </div>
        </form>

        {error ? <p className="error">Failed to load inquiries: {error.message}</p> : null}

        <div className="table-wrap admin-records-table-wrap">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Guest Count</th>
                <th>Status</th>
                <th>Package / Quote</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? (
                data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="admin-record-main">
                        <strong>
                          {row.first_name} {row.last_name}
                        </strong>
                        <span>{row.email}</span>
                        <span>{row.phone}</span>
                      </div>
                    </td>
                    <td>{row.event_type}</td>
                    <td>{row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}</td>
                    <td>{row.guest_count ?? "—"}</td>
                    <td>
                      <div className="admin-record-status-stack">
                        <StatusBadge status={row.status ?? "new"} />
                        <span className="admin-record-substatus">
                          {humanizeLabel(row.consultation_status ?? "not_scheduled")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-record-main">
                        <strong>${formatMoney(Number(row.estimated_price ?? 0))}</strong>
                        <span>{row.quote_response_status ? humanizeLabel(row.quote_response_status) : "Not sent"}</span>
                        <span>{row.venue_name ?? "Venue not added"}</span>
                      </div>
                    </td>
                    <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td>
                      <InquiryRecordActions inquiryId={row.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="admin-records-empty">
                    No inquiry records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-records">
          {data?.map((row) => (
            <div key={row.id} className="admin-mobile-record">
              <div className="admin-mobile-record-head">
                <div>
                  <strong>{row.first_name} {row.last_name}</strong>
                  <span>{row.event_type}</span>
                </div>
                <StatusBadge status={row.status ?? "new"} />
              </div>

              <div className="admin-mobile-record-grid">
                <p>
                  <span>Event date</span>
                  {row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}
                </p>
                <p>
                  <span>Guest count</span>
                  {row.guest_count ?? "—"}
                </p>
                <p>
                  <span>Quote</span>
                  ${formatMoney(Number(row.estimated_price ?? 0))}
                </p>
                <p>
                  <span>Created</span>
                  {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>

              <InquiryRecordActions inquiryId={row.id} />
            </div>
          ))}
        </div>

        <div className="admin-table-pagination">
          <p className="muted">
            Page {page} of {totalPages}
          </p>
          <div className="admin-package-actions">
            {previousPage ? (
              <Link href={buildPageHref(previousPage)} className="btn secondary">
                Previous
              </Link>
            ) : null}
            {nextPage ? (
              <Link href={buildPageHref(nextPage)} className="btn secondary">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
