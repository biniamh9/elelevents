import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import StatusBadge from "@/components/forms/admin/status-badge";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event_type?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const eventType = params.event_type || "";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();
  const nowIso = new Date().toISOString();
  const nextSevenDaysIso = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  let query = supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, created_at, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, estimated_price, consultation_status, consultation_at, follow_up_at, quote_response_status"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error } = await query;

  const { count: totalCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true });

  const { count: newCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: contactedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "contacted");

  const { count: quotedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const { count: bookedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked");

  const { count: lostCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed_lost");

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

  const { data: avgInquiryRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const averageInquiryValue =
    avgInquiryRows && avgInquiryRows.length > 0
      ? avgInquiryRows.reduce(
          (sum, row) => sum + Number(row.estimated_price ?? 0),
          0
        ) / avgInquiryRows.length
      : 0;

  const { count: scheduledConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("consultation_status", "scheduled");

  const { count: followUpsDue } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .not("follow_up_at", "is", null)
    .lte("follow_up_at", nextSevenDaysIso);

  const { data: upcomingConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, consultation_type, consultation_at")
    .eq("consultation_status", "scheduled")
    .not("consultation_at", "is", null)
    .gte("consultation_at", nowIso)
    .order("consultation_at", { ascending: true })
    .limit(5);

  const { data: followUpItems } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, follow_up_at, quote_response_status")
    .not("follow_up_at", "is", null)
    .lte("follow_up_at", nextSevenDaysIso)
    .order("follow_up_at", { ascending: true })
    .limit(5);

  const { data: recentInquiries } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, status, estimated_price")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentQuoted } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, estimated_price")
    .eq("status", "quoted")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentBooked } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, estimated_price")
    .eq("status", "booked")
    .order("created_at", { ascending: false })
    .limit(5);

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];
  const eventTypes = [
    "Wedding",
    "Traditional (Melsi)",
    "Birthday",
    "Baby Shower",
    "Corporate Event",
    "Graduation",
  ];

  return (
    <main className="section admin-page">
      <div className="admin-dashboard-hero">
        <div className="card admin-hero-card">
          <p className="eyebrow">Sales Dashboard</p>
          <h1>Inquiries Pipeline</h1>
          <p className="lead">
            Track new leads, consultation workload, pipeline value, and booked
            business from one screen.
          </p>
          <div className="summary-pills">
            <span className="summary-chip">Total inquiries: {totalCount ?? 0}</span>
            <span className="summary-chip">Pipeline value: ${formatMoney(pipelineValue)}</span>
            <span className="summary-chip">Conversion: {conversionRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="card admin-focus-card">
          <p className="eyebrow">This Week</p>
          <div className="admin-mini-metrics">
            <div>
              <strong>{scheduledConsultations ?? 0}</strong>
              <span>Consultations scheduled</span>
            </div>
            <div>
              <strong>{followUpsDue ?? 0}</strong>
              <span>Follow-ups due</span>
            </div>
            <div>
              <strong>{bookedCount ?? 0}</strong>
              <span>Booked events</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="card metric-card metric-card--amber">
          <p className="muted">New Leads</p>
          <strong>{newCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--blue">
          <p className="muted">Contacted</p>
          <strong>{contactedCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--violet">
          <p className="muted">Quoted</p>
          <strong>{quotedCount ?? 0}</strong>
        </div>
        <div className="card metric-card metric-card--green">
          <p className="muted">Booked</p>
          <strong>{bookedCount ?? 0}</strong>
        </div>
        <div className="card metric-card">
          <p className="muted">Booked This Month</p>
          <strong>{bookedThisMonth ?? 0}</strong>
        </div>
        <div className="card metric-card">
          <p className="muted">Booked Revenue</p>
          <strong>${formatMoney(bookedRevenueThisMonth)}</strong>
        </div>
        <div className="card metric-card">
          <p className="muted">Average Inquiry</p>
          <strong>${formatMoney(averageInquiryValue)}</strong>
        </div>
        <div className="card metric-card metric-card--red">
          <p className="muted">Closed Lost</p>
          <strong>{lostCount ?? 0}</strong>
        </div>
      </div>

      <div className="admin-board-grid">
        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Pipeline Funnel</p>
              <h3>Where leads are sitting</h3>
            </div>
          </div>
          <div className="funnel-grid">
            <div className="funnel-step">
              <span>New</span>
              <strong>{newCount ?? 0}</strong>
            </div>
            <div className="funnel-step">
              <span>Contacted</span>
              <strong>{contactedCount ?? 0}</strong>
            </div>
            <div className="funnel-step">
              <span>Quoted</span>
              <strong>{quotedCount ?? 0}</strong>
            </div>
            <div className="funnel-step">
              <span>Booked</span>
              <strong>{bookedCount ?? 0}</strong>
            </div>
            <div className="funnel-step">
              <span>Lost</span>
              <strong>{lostCount ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Priority Queue</p>
              <h3>Upcoming consultations</h3>
            </div>
          </div>
          <div className="admin-list">
            {upcomingConsultations?.length ? (
              upcomingConsultations.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {item.consultation_type ?? "consultation"} ·{" "}
                    {item.consultation_at
                      ? new Date(item.consultation_at).toLocaleString()
                      : "No date"}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No upcoming consultations.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Priority Queue</p>
              <h3>Follow-ups due soon</h3>
            </div>
          </div>
          <div className="admin-list">
            {followUpItems?.length ? (
              followUpItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {item.follow_up_at
                      ? new Date(item.follow_up_at).toLocaleString()
                      : "No follow-up"}{" "}
                    · {item.quote_response_status ?? "not_sent"}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No follow-ups due soon.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Newest inquiries</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentInquiries?.length ? (
              recentInquiries.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No recent inquiries.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Recently quoted</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentQuoted?.length ? (
              recentQuoted.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No quoted inquiries yet.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Recently booked</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentBooked?.length ? (
              recentBooked.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No booked inquiries yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card admin-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Lead Table</p>
            <h3>All inquiries</h3>
          </div>
        </div>

        <form method="GET" className="admin-filters">
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={status} className="input">
              <option value="">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
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

          <button type="submit" className="btn">
            Filter
          </button>

          <Link href="/admin/inquiries" className="btn secondary">
            Reset
          </Link>
        </form>

        {error ? <p className="error">Failed to load inquiries: {error.message}</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Consultation</th>
                <th>Follow-Up</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      style={{ color: "#a74471", fontWeight: 600 }}
                    >
                      {row.first_name} {row.last_name}
                    </Link>
                    <div className="muted">{row.email}</div>
                    <div className="muted">{row.phone}</div>
                  </td>
                  <td>{row.event_type}</td>
                  <td>{row.event_date ?? "—"}</td>
                  <td>{row.venue_name ?? "—"}</td>
                  <td>
                    <StatusBadge status={row.status ?? "new"} />
                  </td>
                  <td>{row.consultation_status ?? "not_scheduled"}</td>
                  <td>
                    {row.follow_up_at
                      ? new Date(row.follow_up_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>${formatMoney(Number(row.estimated_price ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
